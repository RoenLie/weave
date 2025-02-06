import { html } from 'lit-html';
import { css, CustomElement, type CSSStyle } from '../../app/custom-element.ts';
import type { Repeat, Vec2 } from '@roenlie/core/types';
import { Connection, GraphNode, type StorableConnection, type StorableGraphNode, type StringVec2 } from '../../app/graph.ts';
import { isOutsideViewport } from '../../app/is-outside-viewport.ts';
import { loadImage } from '../../app/load-image.ts';
import { Canvas2DObject } from './canvas-object.ts';
import { oneOf } from '@roenlie/core/validation';
import { getPathReduction, isRectInsideAnother } from '../../app/path-helpers.ts';
import { View } from '../../app/canvas-view.ts';
import { maybe, waitForPromises } from '@roenlie/core/async';
import { range } from '@roenlie/core/array';


export class PoeCanvasTree extends CustomElement {

	static { this.register('poe-canvas-editor'); }

	protected nodes:         Map<string, GraphNode> = new Map();
	protected connections:   Map<string, Connection> = new Map();
	protected selectedNode?: GraphNode;
	protected hoveredNode?:  GraphNode;
	protected updated?:      number;
	protected saveOngoing:   boolean = false;
	protected saveInterval?: ReturnType<typeof setInterval>;
	protected imageSize = 13000;
	protected chunkSize = 1300;
	protected imagePromises: Map<StringVec2, Promise<any>> = new Map();
	protected images:        {
		x:        number,
		y:        number;
		image:    HTMLImageElement | undefined;
		getImage: () => Promise<HTMLImageElement>;
	}[] = [];

	protected editingFeatures = {
		moveNode:        false,
		createNode:      false,
		resizeNodes:     false,
		deleteNodes:     false,
		connectNodes:    true,
		moveConnections: true,
	};

	protected readonly bgView:   View = new View();
	protected readonly mainView: View = new View();
	protected readonly resizeObserver = new ResizeObserver(entries => {
		const entry = entries[0];
		if (!entry)
			return;

		const width = entry.contentRect.width;
		const height = entry.contentRect.height;

		this.bgView.setCanvasSize(width, height);
		this.mainView.setCanvasSize(width, height);

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

		const bgCanvas = this.shadowRoot!.querySelector('#background') as HTMLCanvasElement;
		this.bgView.setContext(bgCanvas);
		this.bgView.setCanvasSize(width, height);

		const mainCanvas = this.shadowRoot!.querySelector('#main') as HTMLCanvasElement;
		this.mainView.setContext(mainCanvas);
		this.mainView.setCanvasSize(width, height);

		await this.loadBackgroundImage();
		//const { nodes, connections } = await this.loadFromOPFS();
		const { nodes, connections } = await this.loadFromPublicFile();

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

	protected async loadFromOPFS() {
		const opfsRoot   = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle('tree-canvas', { create: true });
		const file       = await fileHandle.getFile();

		return JSON.parse(await file.text()) as {
			nodes:       StorableGraphNode[];
			connections: StorableConnection[];
		};
	}

	protected async loadFromPublicFile() {
		const [ data, err ] = await maybe(fetch('/graphs/graph-version-2.json')
			.then(res => res.json()));

		if (err)
			throw err;

		return data as {
			nodes:       StorableGraphNode[];
			connections: StorableConnection[];
		};
	}

	protected async save() {
		// Only save if the graph has been updated and a save is not already ongoing.
		if (!this.updated || this.saveOngoing)
			return;

		// We clear the updated flag so that a new update can be detected
		this.updated = undefined;

		// We set the saveOngoing flag to prevent multiple saves at the same time
		this.saveOngoing = true;

		const nodes = this.nodes.values().map(node => node.toStorable()).toArray();
		const connections =  this.connections.values().map(con => con.toStorable()).toArray();

		//await this.saveToOPFS(nodes, connections);
		await this.saveToLocalFile(nodes, connections);

		this.saveOngoing = false;
	}

	protected async saveToOPFS(nodes: StorableGraphNode[], connections: StorableConnection[]) {
		// A FileSystemDirectoryHandle whose type is "directory" and whose name is "".
		const opfsRoot   = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle('tree-canvas', { create: true });
		const writable   = await fileHandle.createWritable({ keepExistingData: false });
		await writable.write(JSON.stringify({ nodes, connections }));
		await writable.close();

		console.log('Saved to OPFS');
	}

	protected async saveToLocalFile(nodes: StorableGraphNode[], connections: StorableConnection[]) {
		const [ , err ] = await maybe(fetch('/save-graph-to-file', {
			method:  'POST',
			headers: { 'Content-Type': 'application/json' },
			body:    JSON.stringify({ version: 2, nodes, connections }),
		}).then(res => res.status));

		if (err)
			console.error(err);
		else
			console.log('Saved to local filesystem');
	}

	protected async loadBackgroundImage() {
		this.images = range(0, 100).map(i => {
			return {
				getImage: () => loadImage(`/background/v2/poe2-bg${ i + 1 }.webp`),
				image:    undefined,
				x:        (i % 10) * this.chunkSize,
				y:        Math.floor(i / 10) * this.chunkSize,
			};
		});

		const imageSize = this.imageSize;
		const parentWidth = this.offsetWidth;
		const parentHeight = this.offsetHeight;
		const y = parentHeight / 2 - imageSize / 2;
		const x = parentWidth  / 2 - imageSize  / 2;

		this.bgView.moveTo(x, y);
		this.mainView.moveTo(x, y);
		this.drawBackgroundCanvas();
		this.drawMainCanvas();
	}

	protected isImgInView(img: { x: number, y: number }) {
		const { x: dx1, y: dy1 } = img;
		const dx2 = dx1 + this.chunkSize;
		const dy2 = dy1 + this.chunkSize;

		const { x1, x2, y1, y2 } = this.bgView.viewport;

		return isRectInsideAnother([ dx1, dy1, dx2, dy2 ], [ x1, y1, x2, y2 ]);
	}

	protected getGraphNode(vec: Vec2): GraphNode | undefined {
		// If found, returns the node at the mouse position.
		for (const [ , node ] of this.nodes) {
			if (!node.path)
				continue;

			const isInPath = node.path.isPointInPath(this.mainView.offscreenCtx, vec.x, vec.y);
			if (isInPath)
				return node;
		}
	}

	protected getPathHandle(vec: Vec2): Vec2 | undefined {
		// If found, returns the handle vector at the mouse position.
		for (const [ , con ] of this.connections) {
			if (con.pathHandle1) {
				const isInPath = con.pathHandle1.isPointInPath(this.mainView.offscreenCtx, vec.x, vec.y);
				if (isInPath)
					return con.m1;
			}
			if (con.pathHandle2) {
				const isInPath = con.pathHandle2.isPointInPath(this.mainView.offscreenCtx, vec.x, vec.y);
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

	protected onMousemove(ev: MouseEvent) {
		const vec = { x: ev.offsetX, y: ev.offsetY };
		const node = this.getGraphNode(vec);

		if (node) {
			if (node !== this.hoveredNode) {
				if (this.hoveredNode) {
					const prevNode = this.hoveredNode;
					this.hoveredNode = node;
					prevNode.path = this.createNode(prevNode);
				}

				this.hoveredNode ??= node;
				this.hoveredNode.path = this.createNode(node);
				this.mainView.markDirty();
				this.drawMainCanvas();
			}
		}
		else if (this.hoveredNode) {
			const node = this.hoveredNode;
			this.hoveredNode = undefined;
			node.path = this.createNode(node);
			this.mainView.markDirty();
			this.drawMainCanvas();
		}
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
	}

	protected onMousedown(ev: MouseEvent) {
		// We only care about left clicks
		if (ev.buttons !== 1)
			return;

		ev.preventDefault();
		this.focus();

		// Get the offset from the corner of the current view to the mouse position
		const viewOffsetX = ev.offsetX - this.mainView.getPosition().x;
		const viewOffsetY = ev.offsetY - this.mainView.getPosition().y;

		// Get the mouse position in relation to the current view
		const scale = this.mainView.getScale();
		const realX = viewOffsetX / scale;
		const realY = viewOffsetY / scale;

		const vec = { x: ev.offsetX, y: ev.offsetY };
		// Try to find a node or connection at the mouse position
		const nodeOrVec = this.getGraphNode(vec) ?? this.getPathHandle(vec);

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
				if (ev.shiftKey && this.editingFeatures.connectNodes) {
					this.connectNodes(this.selectedNode, nodeOrVec);
				}
				else {
					if (this.selectedNode?.path) {
						const node = this.selectedNode;
						this.selectedNode = undefined;
						node.path = this.createNode(node);
					}

					this.selectedNode = nodeOrVec;
					nodeOrVec.path = this.createNode(nodeOrVec);
				}

				this.mainView.markDirty();
				this.drawMainCanvas();

				this.editingFeatures.moveNode && (mousemove = (ev: MouseEvent) => {
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
				});
			}
			else {
				const con = this.connections.values()
					.find(c => c.m1 === nodeOrVec || c.m2 === nodeOrVec);

				if (!con)
					return;

				this.editingFeatures.moveConnections && (mousemove = (ev: MouseEvent) => {
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
				});
			}

			addEventListener('mousemove', mousemove);
			addEventListener('mouseup', mouseup);
		}
		// If we didn't find a node or a connection, we want to pan the view
		// and create a node if alt/cmd is pressed
		else {
			// We are holding alt or double clicking the canvas
			// so we want to create a new node
			if (this.editingFeatures.createNode && (ev.detail === 2 || ev.altKey || ev.metaKey)) {
				const node = new GraphNode({ x: realX, y: realY });

				if (this.selectedNode?.path) {
					const node = this.selectedNode;
					this.selectedNode = undefined;
					node.path = this.createNode(node);
				}

				this.selectedNode = node;
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
		if (this.selectedNode) {
			const node = this.selectedNode;

			if (this.editingFeatures.resizeNodes && oneOf(ev.code, 'Digit1', 'Digit2', 'Digit3')) {
				if (ev.code === 'Digit1')
					node.radius = node.sizes[0]!;

				if (ev.code === 'Digit2')
					node.radius = node.sizes[1]!;

				if (ev.code === 'Digit3')
					node.radius = node.sizes[2]!;

				node.path = this.createNode(node);
				this.updated = Date.now();
			}
			else if (this.editingFeatures.deleteNodes && ev.code === 'Delete') {
				node.connections.forEach(con => this.connections.delete(con.id));
				this.nodes.delete(node.id);
				this.updated = Date.now();
			}
			else if (ev.code === 'Escape') {
				this.selectedNode = undefined;
				node.path = this.createNode(node);
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
		const [ startXReduce, startYReduce ] = getPathReduction(startRadius, startVec, mid1Vec);
		startVec.x += startXReduce;
		startVec.y += startYReduce;

		const stopRadius = nodes.get(con.stop.id)!.radius;
		const [ stopXReduce, stopYReduce ] = getPathReduction(stopRadius, mid2Vec, stopVec);
		stopVec.x -= stopXReduce;
		stopVec.y -= stopYReduce;

		const path = new Canvas2DObject();
		path.clear()
			.layer(
				(path2D) => {
					path2D.moveTo(startVec.x, startVec.y);
					path2D.bezierCurveTo(
						mid1Vec.x, mid1Vec.y,
						mid2Vec.x, mid2Vec.y,
						stopVec.x, stopVec.y,
					);
				},
				(ctx, path2D) => {
					ctx.strokeStyle = 'rgb(72 61 139)';
					ctx.lineWidth = 4;
					ctx.stroke(path2D);

					ctx.lineWidth = 0;
					ctx.strokeStyle = '';
				},
			);

		//path.strokeStyle = 'rgb(72 61 139)';
		//path.lineWidth = 4;

		//path.moveTo(startVec.x, startVec.y);
		//path.bezierCurveTo(
		//	mid1Vec.x, mid1Vec.y,
		//	mid2Vec.x, mid2Vec.y,
		//	stopVec.x, stopVec.y,
		//);

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
			con.path.draw(this.mainView.offscreenCtx);
		}
	}
	//#endregion

	//#region node
	protected createNode(node: GraphNode) {
		const path = new Canvas2DObject();
		path.clear()
			.layer(
				(path2D) => {
					path2D.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
				},
				(ctx, path2D) => {
					//ctx.strokeStyle = 'rgb(241 194 50)';
					ctx.strokeStyle = 'white';
					ctx.lineWidth = 2;
					ctx.stroke(path2D);

					if (this.selectedNode === node) {
						ctx.fillStyle = 'rgb(255 255 255 / 20%)';
						ctx.fill(path2D);
					}
					else if (this.hoveredNode === node) {
						ctx.fillStyle = 'rgb(241 194 50 / 50%)';
						ctx.fill(path2D);
					}

					ctx.lineWidth = 0;
					ctx.strokeStyle = '';
					ctx.fillStyle = '';
				},
			);

		return path;
	}

	protected mapNodes() {
		for (const node of this.nodes.values()) {
			if (isOutsideViewport(this.mainView.viewport, node))
				continue;

			node.path ??= this.createNode(node);
			node.path.draw(this.mainView.offscreenCtx);
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
		const len = 6;
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
		path.clear()
			.layer(
				(path2D) => {
					path2D.moveTo(points[0].x, points[0].y);
					path2D.lineTo(points[1].x, points[1].y);
					path2D.lineTo(points[2].x, points[2].y);
					path2D.lineTo(points[3].x, points[3].y);
					path2D.closePath();
				},
				(ctx, path2D) => {
					ctx.fillStyle = 'rgb(240 240 240 / 50%)';
					ctx.fill(path2D);

					ctx.fillStyle = '';
				},
			);

		return path;
	}

	protected createPathHandle2(con: Connection) {
		const len = 6;
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
		path.clear()
			.layer(
				(path2D) => {
					path2D.moveTo(points[0].x, points[0].y);
					path2D.lineTo(points[1].x, points[1].y);
					path2D.lineTo(points[2].x, points[2].y);
					path2D.lineTo(points[3].x, points[3].y);
					path2D.closePath();
				},
				(ctx, path2D) => {
					ctx.fillStyle = 'rgb(240 240 240 / 50%)';
					ctx.fill(path2D);

					ctx.fillStyle = '';
				},
			);

		return path;
	}

	protected mapPathHandles() {
		for (const con of this.connections.values()) {
			if (!isOutsideViewport(this.mainView.viewport, con.m1)) {
				con.pathHandle1 ??= this.createPathHandle1(con);
				con.pathHandle1.draw(this.mainView.offscreenCtx);
			}
			if (!isOutsideViewport(this.mainView.viewport, con.m2)) {
				con.pathHandle2 ??= this.createPathHandle2(con);
				con.pathHandle2.draw(this.mainView.offscreenCtx);
			}
		}
	}
	//#endregion


	protected drawBackgroundCanvas() {
		const { bgView } = this;

		if (this.bgView.isDirty())
			bgView.clearContext();

		let foundUnloadedImages = false;
		for (const image of this.images) {
			if (!this.isImgInView(image))
				continue;

			const imgId = `x${ image.x }y${ image.y }` as StringVec2;
			const x = image.x;
			const y = image.y;

			if (image.image) {
				bgView.offscreenCtx.drawImage(image.image, x, y);
			}
			else if (!this.imagePromises.has(imgId)) {
				const loadImage = image.getImage().then(img => image.image = img);
				this.imagePromises.set(imgId, loadImage);
				foundUnloadedImages = true;
			}
		}

		if (foundUnloadedImages)
			waitForPromises(this.imagePromises).then(() => this.drawBackgroundCanvas());

		bgView.transferToOnscreenCanvas();

		// Trying to debug an issue where a quad is not being drawn.
		//const status = this.images.reduce((acc, img, i) => {
		//	const row = Math.floor(i / 10);
		//	const col = i % 10;

		//	acc[row] ??= [];
		//	acc[row][col] = this.isImgInView(img) ? '❤️' : '☠️';

		//	return acc;
		//}, []);

		//console.clear();
		//console.table(status);
	}

	protected drawMainCanvas() {
		const { mainView } = this;

		if (this.mainView.isDirty())
			mainView.clearContext();

		const percentage = this.mainView.getVisiblePercentage(
			this.imageSize, this.imageSize,
		);

		if (percentage < 50)
			this.mapPaths();

		if (percentage < 50)
			this.mapNodes();

		if (percentage < 10)
			this.mapPathHandles();

		mainView.transferToOnscreenCanvas();
	}

	protected override render(): unknown {
		return html`
		<canvas id="background"></canvas>
		<canvas id="main"
			@mousemove=${ this.onMousemove }
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
