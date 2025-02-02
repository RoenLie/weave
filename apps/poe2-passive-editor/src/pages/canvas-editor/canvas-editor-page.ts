import { html } from 'lit-html';
import { css, CustomElement, type CSSStyle } from '../../app/custom-element.ts';
import type { Repeat, Vec2 } from '@roenlie/core/types';
import { tuple } from '@roenlie/core/array';
import { Connection, GraphNode, type StorableConnection, type StorableGraphNode } from '../../app/graph.ts';
import { isOutsideViewport, type Viewport } from '../../app/is-outside-viewport.ts';
import { loadImage } from '../../app/load-image.ts';
import { Canvas2DObject } from './canvas-object.ts';
import { oneOf } from '@roenlie/core/validation';
import { getPathReduction } from '../../app/path-helpers.ts';


export class PoeCanvasTree extends CustomElement {

	static { this.register('poe-canvas-editor'); }

	protected bgCanvas:      HTMLCanvasElement;
	protected bgContext:     CanvasRenderingContext2D;
	protected mainCanvas:    HTMLCanvasElement;
	protected mainContext:   CanvasRenderingContext2D;
	protected image:         HTMLImageElement;
	protected imageVec:      Vec2 = { x: 0, y: 0 };
	protected nodes:         Map<string, GraphNode> = new Map();
	protected connections:   Map<string, Connection> = new Map();
	protected selectedNode?: GraphNode;
	protected updated?:      number;
	protected saveOngoing:   boolean = false;
	protected saveInterval?: ReturnType<typeof setInterval>;

	protected readonly bgView:   View = new View();
	protected readonly mainView: View = new View();
	protected readonly resizeObserver = new ResizeObserver(entries => {
		const entry = entries[0];
		if (!this.image || !entry)
			return;

		const width = entry.contentRect.width;
		const height = entry.contentRect.height;

		this.bgView.setDimensions(width, height);
		this.bgView.applyTransform();

		this.mainView.setDimensions(width, height);
		this.mainView.applyTransform();

		this.drawBackgroundCanvas();
		this.drawMainCanvas();
	});

	protected override connectedCallback(): void {
		super.connectedCallback();
		this.tabIndex = 0;
	}

	protected override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.resizeObserver.unobserve(this);
		this.removeEventListener('keydown', this.onKeydown);

		clearInterval(this.saveInterval);
	}

	protected override async afterConnected(): Promise<void> {
		super.afterConnected();

		this.resizeObserver.observe(this);
		this.addEventListener('keydown', this.onKeydown);

		const width = this.offsetWidth;
		const height = this.offsetHeight;

		this.mainCanvas = this.shadowRoot!.querySelector('#main') as HTMLCanvasElement;
		this.mainContext = this.mainCanvas.getContext('2d') as CanvasRenderingContext2D;

		this.bgCanvas = this.shadowRoot!.querySelector('#background') as HTMLCanvasElement;
		this.bgContext = this.bgCanvas.getContext('2d') as CanvasRenderingContext2D;

		this.bgView.setContext(this.bgContext);
		this.bgView.setDimensions(width, height);
		this.mainView.setContext(this.mainContext);
		this.mainView.setDimensions(width, height);

		await this.loadBackgroundImage();
		await this.loadFromOPFS();
	}

	protected async loadFromOPFS() {
		const opfsRoot   = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle('tree-canvas', { create: true });
		const file       = await fileHandle.getFile();
		const { connections, nodes } = JSON.parse(await file.text()) as {
			nodes:       StorableGraphNode[];
			connections: StorableConnection[];
		};

		this.nodes = new Map(nodes.map(node => {
			const parsed = new GraphNode(node);

			return [ parsed.id, parsed ];
		}));
		this.connections = new Map(connections.map(con => {
			const parsed = new Connection(this.nodes, con);

			return [ parsed.id, parsed ];
		}));

		for (const node of this.nodes.values())
			node.mapConnections(this.connections);

		this.saveInterval = setInterval(this.save.bind(this), 5000);

		this.drawMainCanvas();
	}

	protected async save() {
		// Only save if the graph has been updated and a save is not already ongoing.
		if (!this.updated || this.saveOngoing)
			return;

		// We clear the updated flag so that a new update can be detected
		this.updated = undefined;

		// We set the saveOngoing flag to prevent multiple saves at the same time
		this.saveOngoing = true;

		await this.saveToOPFS();

		this.saveOngoing = false;
	}

	protected async saveToOPFS() {
		const nodes = this.nodes.values().map(node => node.toStorable()).toArray();
		const connections =  this.connections.values().map(con => con.toStorable()).toArray();

		// A FileSystemDirectoryHandle whose type is "directory" and whose name is "".
		const opfsRoot   = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle('tree-canvas', { create: true });
		const writable   = await fileHandle.createWritable({ keepExistingData: false });
		await writable.write(JSON.stringify({ nodes, connections }));
		await writable.close();

		console.log('Saved to OPFS');
	}

	protected async loadBackgroundImage() {
		this.image = await loadImage('/poe2-tree.png');

		const parentWidth = this.offsetWidth;
		const parentHeight = this.offsetHeight;
		const y = parentHeight / 2 - this.image.naturalHeight / 2;
		const x = parentWidth  / 2 - this.image.naturalWidth  / 2;

		this.bgView.moveTo(x, y);
		this.mainView.moveTo(x, y);
		this.drawBackgroundCanvas();
		this.drawMainCanvas();
	}

	protected getVisiblePercentage(): number {
		const imageWidth     = this.image.naturalWidth;
		const imageHeight    = this.image.naturalHeight;
		const canvasViewport = this.mainView.viewport;

		const totalArea    = imageWidth * imageHeight;
		const viewportArea = (canvasViewport.x2 - canvasViewport.x1)
			* (canvasViewport.y2 - canvasViewport.y1);

		const percentage = (viewportArea / totalArea) * 100;

		return percentage;
	}

	protected getVec2(vec: Vec2): Vec2 | undefined {
		// If found, returns the node at the mouse position.
		for (const [ , node ] of this.nodes) {
			if (!node.path)
				continue;

			const isInPath = this.mainContext.isPointInPath(node.path, vec.x, vec.y);
			if (isInPath)
				return node;
		}

		// If found, returns the handle vector at the mouse position.
		for (const [ , con ] of this.connections) {
			if (con.pathHandle1) {
				const isInPath = this.mainContext.isPointInPath(con.pathHandle1, vec.x, vec.y);
				if (isInPath)
					return con.m1;
			}
			if (con.pathHandle2) {
				const isInPath = this.mainContext.isPointInPath(con.pathHandle2, vec.x, vec.y);
				if (isInPath)
					return con.m2;
			}
		}
	}

	protected connectNodes(nodeA?: GraphNode, nodeB?: GraphNode) {
		if (!nodeA || !nodeB)
			return;

		const nodeHasNode = (a: GraphNode, b: GraphNode) => a.connections.some(
			connection => connection.start.id === b.id || connection.stop.id === b.id,
		);

		const nodeAHasNodeB = nodeHasNode(nodeA, nodeB);
		if (nodeAHasNodeB)
			return;

		const nodeBHasNodeA = nodeHasNode(nodeB, nodeA);
		if (nodeBHasNodeA)
			return;

		const connection = new Connection(this.nodes, { start: nodeA, stop: nodeB });

		this.connections.set(connection.id, connection);
		nodeA.connections.push(connection);
		nodeB.connections.push(connection);

		this.updated = Date.now();
	}

	protected onMousewheel(ev: WheelEvent) {
		ev.preventDefault();

		const x = ev.offsetX;
		const y = ev.offsetY;

		if (-ev.deltaY > 0) {
			this.bgView.scaleAt({ x, y }, 1.1);
			this.mainView.scaleAt({ x, y }, 1.1);
		}
		else {
			this.bgView.scaleAt({ x, y }, 1 / 1.1);
			this.mainView.scaleAt({ x, y }, 1 / 1.1);
		}

		this.drawBackgroundCanvas();
		this.drawMainCanvas();

		this.getVisiblePercentage();
	}

	protected onMousedown(ev: MouseEvent) {
		this.focus();

		if (ev.buttons !== 1)
			return;

		ev.preventDefault();

		// Get the offset from the corner of the current view to the mouse position
		const viewOffsetX = ev.offsetX - this.mainView.getPosition().x;
		const viewOffsetY = ev.offsetY - this.mainView.getPosition().y;

		// Get the mouse position in relation to the current view
		const scale = this.mainView.getScale();
		const realX = viewOffsetX / scale;
		const realY = viewOffsetY / scale;

		// Try to find a node or connection at the mouse position
		const nodeOrVec = this.getVec2({ x: ev.offsetX, y: ev.offsetY });

		// If we found a node or a connection, we want to move it
		if (nodeOrVec) {
			// We setup the mousemove and mouseup events
			// For moving the node or connection
			const mouseOffsetX = (realX - nodeOrVec.x) * scale;
			const mouseOffsetY = (realY - nodeOrVec.y) * scale;

			let mousemove: (ev: MouseEvent) => void = () => {};
			const mouseup = () => {
				removeEventListener('mousemove', mousemove);
				removeEventListener('mouseup', mouseup);
			};

			// We are clicking on a node
			if (GraphNode.isGraphNode(nodeOrVec)) {
				if (ev.shiftKey) {
					this.connectNodes(this.selectedNode, nodeOrVec);
				}
				else {
					if (this.selectedNode?.path)
						this.selectedNode.path.fillStyle = '';

					this.selectedNode = nodeOrVec;
					nodeOrVec.path = this.createNode(nodeOrVec);
				}

				this.mainView.markDirty();
				this.drawMainCanvas();

				mousemove = (ev: MouseEvent) => {
					const scale = this.mainView.getScale();

					const x = ev.offsetX - this.mainView.getPosition().x - mouseOffsetX;
					const y = ev.offsetY - this.mainView.getPosition().y - mouseOffsetY;
					nodeOrVec.x = x / scale;
					nodeOrVec.y = y / scale;

					nodeOrVec.path = this.createNode(nodeOrVec);

					for (const con of nodeOrVec.connections) {
						const point = con.start.id === nodeOrVec.id
							? con.start
							: con.stop;

						point.x = nodeOrVec.x;
						point.y = nodeOrVec.y;

						con.path = this.createPath(this.nodes, con);
						con.pathHandle1 = this.createPathHandle1(con);
						con.pathHandle2 = this.createPathHandle2(con);
					}

					this.mainView.markDirty();
					this.drawMainCanvas();
					this.updated = Date.now();
				};
			}
			else {
				const con = this.connections.values()
					.find(c => c.m1 === nodeOrVec || c.m2 === nodeOrVec);

				if (!con)
					return;

				mousemove = (ev: MouseEvent) => {
					const scale = this.mainView.getScale();

					const x = ev.offsetX - this.mainView.getPosition().x - mouseOffsetX;
					const y = ev.offsetY - this.mainView.getPosition().y - mouseOffsetY;
					nodeOrVec.x = x / scale;
					nodeOrVec.y = y / scale;

					con.path = this.createPath(this.nodes, con);
					con.pathHandle1 = this.createPathHandle1(con);
					con.pathHandle2 = this.createPathHandle2(con);

					this.mainView.markDirty();
					this.drawMainCanvas();
					this.updated = Date.now();
				};
			}

			addEventListener('mousemove', mousemove);
			addEventListener('mouseup', mouseup);
		}
		// If we didn't find a node or a connection, we want to pan the view
		else {
			// We are holding alt or double clicking the canvas
			// so we want to create a new node
			if (ev.detail === 2 || ev.altKey) {
				const node = new GraphNode({ x: realX, y: realY });

				this.nodes.set(node.id, node);
				this.updated = Date.now();
				this.mainView.markDirty();
				this.drawMainCanvas();
			}

			// We setup the mousemove and mouseup events
			// For panning the view
			const mousemove = (ev: MouseEvent) => {
				this.bgView.moveTo(ev.offsetX - viewOffsetX, ev.offsetY - viewOffsetY);
				this.mainView.moveTo(ev.offsetX - viewOffsetX, ev.offsetY - viewOffsetY);

				this.drawBackgroundCanvas();
				this.drawMainCanvas();
			};
			const mouseup = () => {
				removeEventListener('mousemove', mousemove);
				removeEventListener('mouseup', mouseup);
			};

			addEventListener('mousemove', mousemove);
			addEventListener('mouseup', mouseup);
		}
	}

	protected onKeydown = (ev: KeyboardEvent) => {
		//console.log(ev);

		if (this.selectedNode) {
			const node = this.selectedNode;

			if (oneOf(ev.code, 'Digit1', 'Digit2', 'Digit3')) {
				if (ev.code === 'Digit1')
					node.radius = 7;

				if (ev.code === 'Digit2')
					node.radius = 10;

				if (ev.code === 'Digit3')
					node.radius = 15;

				node.path = this.createNode(node);
				this.updated = Date.now();
			}
			else if (ev.code === 'Escape') {
				this.selectedNode = undefined;
				node.path = this.createNode(node);
			}
			else if (ev.code === 'Delete') {
				node.connections.forEach(con => this.connections.delete(con.id));
				this.nodes.delete(node.id);
				this.updated = Date.now();
			}

			this.mainView.markDirty();
			this.drawMainCanvas();
		}
	};

	//#region path
	protected createPath(nodes: Map<string, GraphNode>, con: Connection) {
		const startVec = structuredClone(con.start);
		const stopVec = structuredClone(con.stop);
		const mid1Vec = structuredClone(con.m1);
		const mid2Vec = structuredClone(con.m2);

		const startRadius = nodes.get(con.start.id)!.radius;
		const [ startXreduce, startYreduce ] = getPathReduction(startRadius, startVec, mid1Vec);
		startVec.x += startXreduce;
		startVec.y += startYreduce;

		const stopRadius = nodes.get(con.stop.id)!.radius;
		const [ stopXreduce, stopYreduce ] = getPathReduction(stopRadius, mid2Vec, stopVec);
		stopVec.x -= stopXreduce;
		stopVec.y -= stopYreduce;

		const path = new Canvas2DObject();
		path.strokeStyle = 'darkslateblue';
		path.lineWidth = 2;

		path.moveTo(startVec.x, startVec.y);
		path.bezierCurveTo(
			mid1Vec.x, mid1Vec.y,
			mid2Vec.x, mid2Vec.y,
			stopVec.x, stopVec.y,
		);

		return path;
	}

	protected mapPaths() {
		for (const con of this.connections.values()) {
			const outsideStart = isOutsideViewport(this.mainView.viewport, con.start);
			const outsideMid1  = isOutsideViewport(this.mainView.viewport, con.m1);
			const outsideMid2  = isOutsideViewport(this.mainView.viewport, con.m2);
			const outsideStop  = isOutsideViewport(this.mainView.viewport, con.stop);
			if (outsideStart && outsideStop && outsideMid1 && outsideMid2)
				continue;

			con.path ??= this.createPath(this.nodes, con);
			con.path.draw(this.mainContext);
		}
	}
	//#endregion

	//#region node
	protected createNode(node: GraphNode) {
		const path = new Canvas2DObject();
		path.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);

		path.lineWidth = 1;
		path.strokeStyle = 'silver';

		if (this.selectedNode === node)
			path.fillStyle = 'rgba(255, 255, 255, 0.5)';
		else
			path.fillStyle = '';

		return path;
	}

	protected mapNodes() {
		for (const node of this.nodes.values()) {
			if (isOutsideViewport(this.mainView.viewport, node))
				continue;

			node.path ??= this.createNode(node);
			node.path.draw(this.mainContext);
		}
	}
	//#endregion

	//#region handle
	protected calculatePathAngle(start: Vec2, stop: Vec2) {
		const deltaX = stop.x - start.x;
		const deltaY = stop.y - start.y;
		const angleInRadians = Math.atan2(deltaY, deltaX);
		const angleInDegrees = angleInRadians * (180 / Math.PI);

		return angleInDegrees;
	};

	protected rotatePoint(point: Vec2, angleInDegrees: number, origin = { x: 0, y: 0 }) {
		const angleInRadians = angleInDegrees * (Math.PI / 180);
		const cosAngle = Math.cos(angleInRadians);
		const sinAngle = Math.sin(angleInRadians);

		const translatedX = point.x - origin.x;
		const translatedY = point.y - origin.y;

		const rotatedX = translatedX * cosAngle - translatedY * sinAngle;
		const rotatedY = translatedX * sinAngle + translatedY * cosAngle;

		return {
			x: rotatedX + origin.x,
			y: rotatedY + origin.y,
		};
	};

	protected rotateVertices(vertices: Vec2[], angleInDegrees: number, origin = { x: 0, y: 0 }) {
		return vertices.map(vertex => this.rotatePoint(vertex, angleInDegrees, origin));
	}

	protected createPathHandle1(con: Connection) {
		const len = 2;
		const rawPoints = [
			{ x: con.m1.x - len, y: con.m1.y       },
			{ x: con.m1.x,       y: con.m1.y - len },
			{ x: con.m1.x + len, y: con.m1.y       },
			{ x: con.m1.x,       y: con.m1.y + len },
		];

		const points = this.rotateVertices(
			rawPoints, this.calculatePathAngle(con.start, con.m2), con.m1,
		) as Repeat<4, Vec2>;

		const path = new Canvas2DObject();
		path.moveTo(points[0].x, points[0].y);
		path.lineTo(points[1].x, points[1].y);
		path.lineTo(points[2].x, points[2].y);
		path.lineTo(points[3].x, points[3].y);
		path.closePath();

		path.fillStyle = 'rgb(240 240 240 / 50%)';

		return path;
	}

	protected createPathHandle2(con: Connection) {
		const len = 2;
		const rawPoints = [
			{ x: con.m2.x - len, y: con.m2.y       },
			{ x: con.m2.x,       y: con.m2.y - len },
			{ x: con.m2.x + len, y: con.m2.y       },
			{ x: con.m2.x,       y: con.m2.y + len },
		];

		const points = this.rotateVertices(
			rawPoints, this.calculatePathAngle(con.m1, con.stop), con.m2,
		) as Repeat<4, Vec2>;

		const path = new Canvas2DObject();
		path.moveTo(points[0].x, points[0].y);
		path.lineTo(points[1].x, points[1].y);
		path.lineTo(points[2].x, points[2].y);
		path.lineTo(points[3].x, points[3].y);
		path.closePath();

		path.fillStyle = 'rgb(240 240 240 / 50%)';

		return path;
	}

	protected mapPathHandles() {
		for (const con of this.connections.values()) {
			if (!isOutsideViewport(this.mainView.viewport, con.m1)) {
				con.pathHandle1 ??= this.createPathHandle1(con);
				con.pathHandle1.draw(this.mainContext);
			}
			if (!isOutsideViewport(this.mainView.viewport, con.m2)) {
				con.pathHandle2 ??= this.createPathHandle2(con);
				con.pathHandle2.draw(this.mainContext);
			}
		}
	}
	//#endregion

	protected drawBackgroundCanvas() {
		if (!this.image)
			return;

		const { bgView, bgContext, bgCanvas: { width, height } } = this;

		if (this.bgView.isDirty()) {
			bgContext.setTransform(1, 0, 0, 1, 0, 0);
			bgContext.clearRect(0, 0, width, height);
			bgView.applyTransform();
		}

		bgContext.drawImage(this.image, this.imageVec.x, this.imageVec.y);
	}

	protected drawMainCanvas() {
		const { mainView, mainContext, mainCanvas: { width, height } } = this;

		if (this.mainView.isDirty()) {
			mainContext.setTransform(1, 0, 0, 1, 0, 0);
			mainContext.clearRect(0, 0, width, height);
			mainView.applyTransform();
		}

		const percentage = this.getVisiblePercentage();

		if (percentage < 50)
			this.mapPaths();

		this.mapNodes();

		if (percentage < 10)
			this.mapPathHandles();
	}

	protected override render(): unknown {
		return html`
		<canvas id="background"></canvas>
		<canvas id="main"
			@mousedown =${ this.onMousedown }
			@mousewheel=${ this.onMousewheel }
		></canvas>
		`;
	}

	public static override styles: CSSStyle = css`
		:host {
			contain: strict;
			display: grid;
			outline: none;
		}
		canvas {
			grid-row: 1/2;
			grid-column: 1/2;
			width: 100%;
			height: 100%;
		}
	`;

}


class View {

	public viewport: Viewport = { x1: 0, x2: 0, y1: 0, y2: 0 };
	protected matrix = tuple(1, 0, 0, 1, 0, 0); // current view transform
	protected pos:   Vec2 = { x: 0, y: 0 }; // current position of origin
	protected ctx:   CanvasRenderingContext2D; // reference to the 2D context
	protected scale: number = 1; // current scale
	protected dirty: boolean = true;

	public setContext(context: CanvasRenderingContext2D) {
		this.ctx = context;
		this.dirty = true;
	};

	/** Sets canvas width and height. */
	public setDimensions(width: number, height: number) {
		this.ctx.canvas.width = width;
		this.ctx.canvas.height = height;
	}

	/** Calculcates the current viewport dimensions for the view. */
	protected updateViewport(): void {
		const { x, y } = this.getPosition();
		const scale = this.getScale();

		const viewableWidth = this.ctx.canvas.width;
		const viewableHeight = this.ctx.canvas.height;

		const x1 = -x / scale;
		const y1 = -y / scale;
		const x2 = x1 + (viewableWidth / scale);
		const y2 = y1 + (viewableHeight / scale);

		this.viewport = { x1, x2, y1, y2 };
	}

	/** set the 2D context transform to the view */
	public applyTransform() {
		if (this.dirty)
			this.update();

		const { matrix: m, ctx } = this;
		ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);

		this.updateViewport();
	};

	public getScale() { return this.scale; };
	public getPosition() { return this.pos; }
	public markDirty() { this.dirty = true; }
	public isDirty() { return this.dirty; }
	public update() {
		const { matrix: m, scale, pos } = this;

		this.dirty = false;
		m[3] = m[0] = scale;
		m[2] = m[1] = 0;
		m[4] = pos.x;
		m[5] = pos.y;
	};

	public scaleAt(at: Vec2, amount: number) {
		if (this.dirty)
			this.update();

		this.scale *= amount;
		this.pos.x = at.x - (at.x - this.pos.x) * amount;
		this.pos.y = at.y - (at.y - this.pos.y) * amount;
		this.dirty = true;
	};

	public moveTo(x: number, y: number) {
		if (this.dirty)
			this.update();

		this.pos.x = x;
		this.pos.y = y;
		this.dirty = true;
	};

}
