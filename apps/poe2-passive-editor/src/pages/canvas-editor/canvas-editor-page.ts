import { html } from 'lit-html';
import { css, CustomElement, type CSSStyle } from '../../app/custom-element.ts';
import type { Vec2 } from '@roenlie/core/types';
import { tuple } from '@roenlie/core/array';
import { Connection, GraphNode, type StorableConnection, type StorableGraphNode } from '../../app/graph.ts';
import { isOutsideViewport, type Viewport } from '../../app/is-outside-viewport.ts';
import { loadImage } from '../../app/load-image.ts';


export class PoeCanvasTree extends CustomElement {

	static { this.register('poe-canvas-editor'); }

	protected bgCanvas:    HTMLCanvasElement;
	protected bgContext:   CanvasRenderingContext2D;
	protected mainCanvas:  HTMLCanvasElement;
	protected mainContext: CanvasRenderingContext2D;
	protected image:       HTMLImageElement;
	protected imageVec:    Vec2 = { x: 0, y: 0 };
	protected objects:     any[] = [];
	protected nodes:       Map<string, GraphNode> = new Map();
	protected connections: Map<string, Connection> = new Map();
	protected pauseRender: boolean = false;

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

		this.draw();
	});

	protected override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.resizeObserver.unobserve(this);
	}

	protected override async afterConnected(): Promise<void> {
		super.afterConnected();

		this.resizeObserver.observe(this);

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
		const { connections, nodes } = JSON.parse(await file.text());

		this.nodes = new Map(nodes.map(
			(node: StorableGraphNode) => {
				const parsed = new GraphNode(node);

				return [ parsed.id, parsed ];
			},
		));
		this.connections = new Map(connections.map(
			(con: StorableConnection) => {
				const parsed = new Connection(con);

				return [ parsed.id, parsed ];
			},
		));

		//(async () => {
		//	const nodes = this.nodes.values().map(node => node.toStorable()).toArray();
		//	const connections =  this.connections.values().map(con => con.toStorable()).toArray();

		//	// A FileSystemDirectoryHandle whose type is "directory" and whose name is "".
		//	const opfsRoot   = await navigator.storage.getDirectory();
		//	const fileHandle = await opfsRoot.getFileHandle('tree-canvas', { create: true });
		//	const writable   = await fileHandle.createWritable({ keepExistingData: false });
		//	await writable.write(JSON.stringify({ nodes, connections }));
		//	await writable.close();
		//})();

		this.draw();
	}

	protected async loadBackgroundImage() {
		this.image = await loadImage('/poe2-tree.png');

		const parentWidth = this.offsetWidth;
		const parentHeight = this.offsetHeight;
		const y = parentHeight / 2 - this.image.naturalHeight / 2;
		const x = parentWidth  / 2 - this.image.naturalWidth  / 2;

		this.bgView.moveTo(x, y);
		this.mainView.moveTo(x, y);
		this.draw();
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

		this.draw();
	}

	protected mouseLocation: Vec2 | undefined = undefined;
	protected onMousedown(ev: MouseEvent) {
		if (ev.buttons !== 1)
			return;

		ev.preventDefault();

		// Get the offset from the corner of the current view to the mouse position
		const viewOffsetX = ev.offsetX - this.mainView.getPosition().x;
		const viewOffsetY = ev.offsetY - this.mainView.getPosition().y;

		// Get the mouse position in relation to the current view
		const scale = this.mainView.getScale();
		const dx = viewOffsetX / scale;
		const dy = viewOffsetY / scale;

		let node: GraphNode | undefined;
		let con: Connection | undefined;
		this.nodes.forEach(n => {
			const inHorizontalBounds = n.x - n.radius < dx && dx < n.x + n.radius;
			const inVerticalBounds = n.y - n.radius < dy && dy < n.y + n.radius;
			if (inHorizontalBounds && inVerticalBounds)
				node = n;
		});
		this.connections.forEach(c => {
			const inHorizontalBounds = c.middle.x - 2 < dx && dx < c.middle.x + 2;
			const inVerticalBounds = c.middle.y - 2 < dy && dy < c.middle.y + 2;
			if (inHorizontalBounds && inVerticalBounds)
				con = c;
		});

		if (node || con?.middle) {
			const vec: Vec2 = node ? node : con!.middle;

			const mouseOffsetX = (dx - vec.x) * scale;
			const mouseOffsetY = (dy - vec.y) * scale;

			const mousemove = (ev: MouseEvent) => {
				const scale = this.mainView.getScale();

				const x = ev.offsetX - this.mainView.getPosition().x - mouseOffsetX;
				const y = ev.offsetY - this.mainView.getPosition().y - mouseOffsetY;

				vec.x = x / scale;
				vec.y = y / scale;

				if (vec === node) {
					const connections = node.connections
						.map(id => this.connections.get(id))
						.filter((con): con is Connection => !!con);

					connections.forEach(con => {
						const point = con.start.id === node!.id
							? con.start
							: con.end;

						point.x = vec.x;
						point.y = vec.y;
					});
				}
				if (vec === con?.middle) {
					con.middle.x = vec.x;
					con.middle.y = vec.y;
				}


				this.mainView.markDirty();
				this.draw();
			};
			const mouseup = () => {
				removeEventListener('mousemove', mousemove);
				removeEventListener('mouseup', mouseup);
			};
			addEventListener('mousemove', mousemove);
			addEventListener('mouseup', mouseup);
		}
		else {
			const mousemove = (ev: MouseEvent) => {
				this.bgView.moveTo(ev.offsetX - viewOffsetX, ev.offsetY - viewOffsetY);
				this.mainView.moveTo(ev.offsetX - viewOffsetX, ev.offsetY - viewOffsetY);

				this.draw();
			};
			const mouseup = () => {
				removeEventListener('mousemove', mousemove);
				removeEventListener('mouseup', mouseup);
			};

			addEventListener('mousemove', mousemove);
			addEventListener('mouseup', mouseup);
		}
	}

	//#region path
	protected getPathReduction(radius: number, a: number, b: number) {
		// Calculate the length of the direction vector
		const lengthStart = Math.sqrt(a * a + b * b);

		// Normalize the direction vector
		const nxStart = a / lengthStart;
		const nyStart = b / lengthStart;

		// Scale the normalized vector by the radius
		const reductionXStart = nxStart * radius;
		const reductionYStart = nyStart * radius;

		return [ reductionXStart, reductionYStart ] as const;
	}

	protected drawPath(
		ctx: CanvasRenderingContext2D,
		nodes: Map<string, GraphNode>,
		con: Connection,
	) {
		// Assuming you have start and end coordinates
		let startX = con.start.x;
		let startY = con.start.y;
		let stopX  = con.end.x;
		let stopY  = con.end.y;
		const midX = con.middle.x;
		const midY = con.middle.y;

		// Calculate the direction vector
		const dxStart = midX - startX;
		const dyStart = midY - startY;
		const dxStop  = stopX - midX;
		const dyStop  = stopY - midY;

		const startRadius = nodes.get(con.start.id)?.radius ?? 7;
		const startReduction = this.getPathReduction(startRadius, dxStart, dyStart);
		startX += startReduction[0];
		startY += startReduction[1];

		const stopRadius = nodes.get(con.end.id)?.radius ?? 7;
		const endReduction = this.getPathReduction(stopRadius, dxStop, dyStop);
		stopX -= endReduction[0];
		stopY -= endReduction[1];

		const start = { x: startX, y: startY };
		const cp1 = { x: midX, y: midY };
		const end = { x: stopX, y: stopY };

		ctx.strokeStyle = 'darkslateblue';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(start.x, start.y);
		ctx.quadraticCurveTo(cp1.x, cp1.y, end.x, end.y);
		ctx.stroke();
	}

	protected mapPaths() {
		for (const con of this.connections.values()) {
			const outsideStart  = isOutsideViewport(this.mainView.viewport, con.start);
			const outsideMiddle = isOutsideViewport(this.mainView.viewport, con.middle);
			const outsideEnd    = isOutsideViewport(this.mainView.viewport, con.end);
			if (outsideStart && outsideEnd && outsideMiddle)
				continue;

			this.drawPath(this.mainContext, this.nodes, con);
		}
	}
	//#endregion


	//#region node
	protected drawNode(
		context: CanvasRenderingContext2D,
		node: GraphNode,
	) {
		context.beginPath();
		context.arc(node.x, node.y, node.radius, 0, 2 * Math.PI, false);
		context.lineWidth = 1;
		context.strokeStyle = 'silver';
		context.stroke();
	}

	protected mapNodes() {
		for (const node of this.nodes.values()) {
			if (isOutsideViewport(this.mainView.viewport, node))
				continue;

			this.drawNode(this.mainContext, node);
		}
	}
	//#endregion

	//#region handle
	protected calculatePathAngle(start: Vec2, end: Vec2) {
		const deltaX = end.x - start.x;
		const deltaY = end.y - start.y;
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

	protected drawPathHandle(
		context: CanvasRenderingContext2D,
		con: Connection,
	) {
		const length = 2;
		const rawPoints = [
			{ x: con.middle.x - length, y: con.middle.y },
			{ x: con.middle.x, y: con.middle.y - length },
			{ x: con.middle.x + length, y: con.middle.y },
			{ x: con.middle.x, y: con.middle.y + length },
		];

		const points = this.rotateVertices(
			rawPoints,
			this.calculatePathAngle(con.start, con.end),
			con.middle,
		) as [ Vec2, Vec2, Vec2, Vec2 ];

		context.beginPath();
		context.fillStyle = 'rgb(240 240 240 / 50%)';
		context.moveTo(points[0].x, points[0].y);
		context.lineTo(points[1].x, points[1].y);
		context.lineTo(points[2].x, points[2].y);
		context.lineTo(points[3].x, points[3].y);
		context.closePath();
		context.fill();
	}

	protected mapPathHandles() {
		for (const con of this.connections.values()) {
			if (isOutsideViewport(this.mainView.viewport, con.middle))
				continue;

			this.drawPathHandle(this.mainContext, con);
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

		this.mapPaths();
		this.mapNodes();
		this.mapPathHandles();

		if (this.mouseLocation) {
			const { x, y } = this.mouseLocation;
			mainContext.beginPath();
			mainContext.arc(x, y, 4, 0, 2 * Math.PI, false);
			mainContext.lineWidth = 1;
			mainContext.strokeStyle = 'red';
			mainContext.stroke();
		}
	}

	protected draw() {
		this.drawBackgroundCanvas();
		this.drawMainCanvas();
	};

	protected override render(): unknown {
		return html`
		<canvas id="background"></canvas>
		<canvas
			id="main"
			@mousedown=${ this.onMousedown }
			@mousewheel=${ this.onMousewheel }
		></canvas>
		`;
	}

	public static override styles: CSSStyle = css`
		:host {
			contain: strict;
			display: grid;
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
