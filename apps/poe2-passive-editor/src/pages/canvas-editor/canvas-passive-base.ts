import { html } from 'lit-html';
import { css, CustomElement, type CSSStyle } from '../../app/custom-element.ts';
import type { Vec2 } from '@roenlie/core/types';
import { Connection, GraphNode, type StorableConnection, type StorableGraphNode, type StringVec2 } from '../../app/graph.ts';
import { isOutsideViewport } from '../../app/is-outside-viewport.ts';
import { loadImage } from '../../app/load-image.ts';
import { Canvas2DObject } from './canvas-object.ts';
import { getPathReduction, isRectInsideAnother } from '../../app/path-helpers.ts';
import { ImmediateOrDebounced, View } from '../../app/canvas-view.ts';
import { maybe } from '@roenlie/core/async';
import { range } from '@roenlie/core/array';


export class PoeCanvasPassiveBase extends CustomElement {

	protected nodes:         Map<string, GraphNode> = new Map();
	protected connections:   Map<string, Connection> = new Map();
	protected selectedNode?: GraphNode;
	protected hoveredNode?:  GraphNode;
	protected imageSize:     number = 13000;
	protected chunkSize:     number = 1300;
	protected imagePromises: Map<StringVec2, Promise<any>> = new Map();
	protected images:        {
		x:        number,
		y:        number;
		image:    HTMLImageElement | undefined;
		getImage: () => Promise<HTMLImageElement>;
	}[] = [];

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

		this.drawBackgroundCanvas.immediate();
		this.drawMainCanvas.debounced();
	});

	protected override connectedCallback(): void {
		super.connectedCallback();
		this.tabIndex = 0;
	}

	protected override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.resizeObserver.unobserve(this);
	}

	protected override async afterConnected(): Promise<void> {
		super.afterConnected();

		this.resizeObserver.observe(this);

		const width = this.offsetWidth;
		const height = this.offsetHeight;

		const bgCanvas = this.shadowRoot!.querySelector('#background') as HTMLCanvasElement;
		this.bgView.setContext(bgCanvas);
		this.bgView.setCanvasSize(width, height);
		this.bgView.setTotalArea(this.imageSize, this.imageSize);

		const mainCanvas = this.shadowRoot!.querySelector('#main') as HTMLCanvasElement;
		this.mainView.setContext(mainCanvas);
		this.mainView.setCanvasSize(width, height);
		this.mainView.setTotalArea(this.imageSize, this.imageSize);

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

		this.drawBackgroundCanvas.debounced();
		this.drawMainCanvas.debounced();
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
		this.drawBackgroundCanvas.debounced();
		this.drawMainCanvas.debounced();
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

			const isInPath = node.path.isPointInPath(this.mainView.context, vec.x, vec.y);
			if (isInPath)
				return node;
		}
	}

	protected getPathHandle(vec: Vec2): Vec2 | undefined {
		// If found, returns the handle vector at the mouse position.
		for (const [ , con ] of this.connections) {
			if (con.pathHandle1) {
				const isInPath = con.pathHandle1.isPointInPath(this.mainView.context, vec.x, vec.y);
				if (isInPath)
					return con.m1;
			}
			if (con.pathHandle2) {
				const isInPath = con.pathHandle2.isPointInPath(this.mainView.context, vec.x, vec.y);
				if (isInPath)
					return con.m2;
			}
		}
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
				this.drawMainCanvas.debounced();
			}
		}
		else if (this.hoveredNode) {
			const node = this.hoveredNode;
			this.hoveredNode = undefined;
			node.path = this.createNode(node);
			this.drawMainCanvas.debounced();
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

		this.drawBackgroundCanvas.debounced();
		this.drawMainCanvas.debounced();
	}

	protected onMousedown(ev: MouseEvent) {
		// We only care about left clicks
		if (ev.buttons !== 1)
			return;

		ev.preventDefault();
		this.focus();

		// Get the offset from the corner of the current view to the mouse position
		const viewOffsetX = ev.offsetX - this.mainView.position.x;
		const viewOffsetY = ev.offsetY - this.mainView.position.y;

		const vec = { x: ev.offsetX, y: ev.offsetY };
		// Try to find a node or connection at the mouse position
		const nodeOrVec = this.getGraphNode(vec) ?? this.getPathHandle(vec);

		// If we found a node or a connection, we want to move it
		if (nodeOrVec) {
			// We are clicking on a node
			if (GraphNode.isGraphNode(nodeOrVec)) {
				if (this.selectedNode?.path) {
					const node = this.selectedNode;
					this.selectedNode = undefined;
					node.path = this.createNode(node);
				}

				this.selectedNode = nodeOrVec;
				nodeOrVec.path = this.createNode(nodeOrVec);
			}

			this.drawMainCanvas.debounced();
		}
		// If we didn't find a node or a connection, we want to pan the view
		// and create a node if alt/cmd is pressed
		else {
			// We setup the mousemove and mouseup events
			// For panning the view
			const mousemove = (ev: MouseEvent) => {
				this.bgView.moveTo(ev.offsetX - viewOffsetX, ev.offsetY - viewOffsetY);
				this.mainView.moveTo(ev.offsetX - viewOffsetX, ev.offsetY - viewOffsetY);

				this.drawBackgroundCanvas.debounced();
				this.drawMainCanvas.debounced();
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
		path.layer(
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
			con.path.draw(this.mainView.context);
		}
	}
	//#endregion

	//#region node
	protected createNode(node: GraphNode) {
		const path = new Canvas2DObject();
		path.layer(
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
			node.path.draw(this.mainView.context);
		}
	}
	//#endregion

	protected drawBackground() {
		const { bgView } = this;
		bgView.clearContext();

		for (const image of this.images) {
			if (!this.isImgInView(image))
				continue;

			const imgId = `x${ image.x }y${ image.y }` as StringVec2;
			const x = image.x;
			const y = image.y;

			if (image.image) {
				bgView.context.drawImage(image.image, x, y);
			}
			else if (!this.imagePromises.has(imgId)) {
				this.imagePromises.set(
					imgId,
					image.getImage().then(img => {
						image.image = img;
						this.imagePromises.delete(imgId);
						this.drawBackgroundCanvas.debounced();
					}),
				);
			}
		}

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

	protected drawMain() {
		this.mainView.clearContext();

		const percentage = this.mainView.visiblePercentage;
		if (percentage < 50)
			this.mapPaths();

		if (percentage < 50)
			this.mapNodes();
	}

	protected drawBackgroundCanvas = new ImmediateOrDebounced(this.drawBackground.bind(this));
	protected drawMainCanvas = new ImmediateOrDebounced(this.drawMain.bind(this));

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
		}
	`;

}
