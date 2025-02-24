import { range } from '@roenlie/core/array';
import type { Vec2 } from '@roenlie/core/types';
import { GraphDataManager, FirebaseGraphRepository } from '../../../pages/canvas-editor/data-manager.ts';
import { type StorableGraphNode, GraphNode, type GraphConnection } from '../../graph/graph.ts';
import { Canvas2DObject } from '../canvas-object.ts';
import { getWorkerImageChunk } from './worker-image-assets.ts';
import { isOutsideViewport, type Viewport } from '../is-outside-viewport.ts';
import { drawParallelBezierCurve, type Bezier } from '../parallel-bezier-curve.ts';
import { doRectsOverlap, getPathReduction } from '../path-helpers.ts';
import { type TransferableMouseEvent, type TransferableTouchEvent, type TransferableTouches, type WorkerImplement, createPostMessage } from './canvas-worker-interface.ts';
import { WorkerView } from './worker-view.ts';
import { getAuth } from 'firebase/auth';
import { app } from '../../firebase.ts';


/** Functions available from the main thread to the worker. */
export interface CanvasReaderWorkerApiIn {
	setSize: {
		type:   'setSize',
		width:  number,
		height: number
	};
	setArea: {
		type:   'setArea',
		width:  number,
		height: number
	};
	initBackground: {
		type: 'initBackground'
	};
	moveTo: {
		type: 'moveTo',
		x:    number,
		y:    number
	};
	scaleAt: {
		type:   'scaleAt',
		vec:    Vec2,
		factor: number
	};
	mousedown: {
		type:  'mousedown';
		event: TransferableMouseEvent;
	};
	mousemove: {
		type:  'mousemove';
		event: TransferableMouseEvent;
	};
	touchstart: {
		type:    'touchstart';
		event:   TransferableTouchEvent;
		touches: TransferableTouches[];
		rect:	   DOMRect;
	}
}

/** Functions available from the worker to the main thread. */
export interface CanvasReaderWorkerApiOut {
	startViewMove: {
		type:          'startViewMove',
		initialMouseX: number,
		initialMouseY: number,
		offsetX:       number,
		offsetY:       number,
	}
	startViewTouchMove: {
		type:          'startViewTouchMove',
		initialMouseX: number,
		initialMouseY: number,
		offsetX:       number,
		offsetY:       number,
		scale:         number,
	}
	selectNode: {
		type:   'selectNode',
		nodeId: string,
	}
	enterNode: {
		type:     'enterNode',
		node:     StorableGraphNode;
		position: Vec2;
		viewport: Viewport;
		scale:    number;
	}
	leaveNode: {
		type:     'leaveNode';
		node:     StorableGraphNode;
		position: Vec2;
		viewport: Viewport;
		scale:    number;
	}
}


export class CanvasWorkerReader implements WorkerImplement<CanvasReaderWorkerApiIn> {

	constructor() {
		getAuth(app);
	}

	protected readonly data = new GraphDataManager(new FirebaseGraphRepository());
	protected readonly post = createPostMessage<CanvasReaderWorkerApiOut>();

	protected bgView:   WorkerView;
	protected mainView: WorkerView;

	protected imageSize:     number = 13000;
	protected chunkSize:     number = 1300;
	protected imagePromises: Map<`x${ number }y${ number }`, Promise<any>> = new Map();
	protected images:        {
		x:        number,
		y:        number;
		image:    ImageBitmap | undefined;
		getImage: () => Promise<ImageBitmap>;
	}[] = [];

	protected selectedNode: GraphNode | undefined;
	protected hoveredNode:  GraphNode | undefined;

	public onmessage(ev: MessageEvent<CanvasReaderWorkerApiIn[keyof CanvasReaderWorkerApiIn]>) {
		const fn = (this as any)[ev.data.type];
		if (typeof fn !== 'function')
			return console.error(`Unknown message type: ${ ev.data.type }`);

		fn.call(this, ev.data);
	}

	//#region from main thread
	public async init(data: {
		type: 'init',
		main: OffscreenCanvas,
		bg:   OffscreenCanvas,
	}) {
		this.bgView = new WorkerView(data.bg);
		this.mainView = new WorkerView(data.main);

		await this.data.load();
		this.drawBackground();
		this.drawMain();
	}

	public setSize(data: CanvasReaderWorkerApiIn['setSize']) {
		this.bgView.setCanvasSize(data.width, data.height);
		this.mainView.setCanvasSize(data.width, data.height);

		this.drawBackground();
		this.drawMain();
	}

	public setArea(data: CanvasReaderWorkerApiIn['setArea']) {
		this.bgView.setTotalArea(data.width, data.height);
		this.mainView.setTotalArea(data.width, data.height);

		this.drawBackground();
		this.drawMain();
	}

	public initBackground(_data: CanvasReaderWorkerApiIn['initBackground']) {
		this.images = range(0, 100).map(i => {
			return {
				x:        (i % 10) * this.chunkSize,
				y:        Math.floor(i / 10) * this.chunkSize,
				image:    undefined,
				getImage: () => getWorkerImageChunk(i),
			};
		});

		const imageSize = this.imageSize;
		const parentWidth = this.bgView.canvas.width;
		const parentHeight = this.bgView.canvas.height;
		const y = parentHeight / 2 - imageSize / 2;
		const x = parentWidth  / 2 - imageSize  / 2;

		this.bgView.moveTo(x, y);
		this.mainView.moveTo(x, y);

		this.drawBackground();
		this.drawMain();
	}

	public moveTo(data: CanvasReaderWorkerApiIn['moveTo']) {
		this.bgView.moveTo(data.x, data.y);
		this.mainView.moveTo(data.x, data.y);

		this.drawBackground();
		this.drawMain();
	}

	public scaleAt(data: CanvasReaderWorkerApiIn['scaleAt']) {
		this.bgView.scaleAt(data.vec, data.factor);
		this.mainView.scaleAt(data.vec, data.factor);

		this.drawBackground();
		this.drawMain();
	}

	public mousedown(data: CanvasReaderWorkerApiIn['mousedown']) {
		const event = data.event;

		// Get the offset from the corner of the current view to the mouse position
		const position = this.bgView.position;
		const viewOffsetX = event.offsetX - position.x;
		const viewOffsetY = event.offsetY - position.y;

		const vec = { x: event.offsetX, y: event.offsetY };
		// Try to find a node at the mouse position
		const node = this.getGraphNode(vec);

		// If we found a node, we want to select it
		if (node) {
			this.post.selectNode({
				nodeId: node.id,
			});
		}
		// If we didn't find a node or a connection, we want to pan the view
		else {
			// We setup the mousemove and mouseup events for panning the view
			this.post.startViewMove({
				initialMouseX: event.offsetX,
				initialMouseY: event.offsetY,
				offsetX:       viewOffsetX,
				offsetY:       viewOffsetY,
			});
		}
	}

	public mousemove(data: CanvasReaderWorkerApiIn['mousemove']) {
		const event = data.event;
		const vec = { x: event.offsetX, y: event.offsetY };
		const node = this.getGraphNode(vec);

		if (event.altKey || event.metaKey)
			return;

		// Remove the hover effect if no node, or a new node is hovered
		if (this.hoveredNode && node !== this.hoveredNode) {
			const node = this.hoveredNode;

			this.hoveredNode = undefined;
			node.path.clear();

			this.post.leaveNode({
				node:     GraphNode.toStorable(node),
				position: this.bgView.position,
				viewport: this.bgView.viewport,
				scale:    this.bgView.scaleFactor,
			});

			this.drawMain();
		}

		// Add the hover effect if a node is hovered
		if (node && node !== this.hoveredNode) {
			this.hoveredNode = node;
			node.path.clear();

			this.post.enterNode({
				node:     GraphNode.toStorable(node),
				position: this.bgView.position,
				viewport: this.bgView.viewport,
				scale:    this.bgView.scaleFactor,
			});

			this.drawMain();
		}
	}

	public touchstart(data: CanvasReaderWorkerApiIn['touchstart']) {
		const offsetX = data.touches[0]!.pageX - data.rect.left;
		const offsetY = data.touches[0]!.pageY - data.rect.top;

		// Get the offset from the corner of the current view to the mouse position
		const position = this.bgView.position;
		const viewOffsetX = offsetX - position.x;
		const viewOffsetY = offsetY - position.y;

		const vec = { x: offsetX, y: offsetY };
		// Try to find a node at the mouse position
		const node = this.getGraphNode(vec);

		// If we found a node, we want to select it
		if (node) {
			this.post.selectNode({
				nodeId: node.id,
			});
		}
		// If we didn't find a node or a connection, we want to pan the view
		else {
			// We setup the mousemove and mouseup events for panning the view
			this.post.startViewTouchMove({
				initialMouseX: offsetX,
				initialMouseY: offsetY,
				offsetX:       viewOffsetX,
				offsetY:       viewOffsetY,
				scale:         this.bgView.scaleFactor,
			});
		}
	}
	//#endregion

	protected getGraphNode(vec: Vec2): GraphNode | undefined {
		const nodes = this.data.nodes;

		// If found, returns the node at the mouse position.
		for (const [ , node ] of nodes) {
			if (!node.path)
				continue;

			const isInPath = node.path.isPointInPath(this.mainView.context, vec.x, vec.y);
			if (isInPath)
				return node;
		}
	}

	protected isImgInView(img: { x: number, y: number }) {
		const { x: dx1, y: dy1 } = img;
		const dx2 = dx1 + this.chunkSize;
		const dy2 = dy1 + this.chunkSize;

		const { x1, x2, y1, y2 } = this.bgView.viewport;

		return doRectsOverlap([ dx1, dy1, dx2, dy2 ], [ x1, y1, x2, y2 ]);
	}

	protected drawBackground() {
		this.bgView.clearContext();

		for (const image of this.images) {
			if (!this.isImgInView(image))
				continue;

			const imgId = `x${ image.x }y${ image.y }` as `x${ number }y${ number }`;
			const x = image.x;
			const y = image.y;

			if (image.image) {
				this.bgView.context.drawImage(image.image, x, y);
				continue;
			}

			if (!this.imagePromises.has(imgId)) {
				this.imagePromises.set(
					imgId,
					image.getImage().then(img => {
						image.image = img;
						this.imagePromises.delete(imgId);
						this.drawBackground();
					}),
				);
			}
		}
	}

	protected createConnectionPath2D(nodes: Map<string, GraphNode>, con: GraphConnection, path: Canvas2DObject) {
		const startVec = { ...con.start };
		const stopVec  = { ...con.stop };
		const mid1Vec  = { ...con.m1 };
		const mid2Vec  = { ...con.m2 };

		const startRadius = nodes.get(con.start.id)!.radius;
		const [ startXReduce, startYReduce ] = getPathReduction(startRadius, startVec, mid1Vec);
		startVec.x += startXReduce;
		startVec.y += startYReduce;

		const stopRadius = nodes.get(con.stop.id)!.radius;
		const [ stopXReduce, stopYReduce ] = getPathReduction(stopRadius, mid2Vec, stopVec);
		stopVec.x -= stopXReduce;
		stopVec.y -= stopYReduce;

		path.layer(
			// Middle bezier curve
			(path2D) => {
				path2D.moveTo(startVec.x, startVec.y);
				path2D.bezierCurveTo(
					mid1Vec.x, mid1Vec.y,
					mid2Vec.x, mid2Vec.y,
					stopVec.x, stopVec.y,
				);
			},
			(ctx, path2D) => {
				//ctx.strokeStyle = 'rgb(33, 29, 16)';
				ctx.strokeStyle = 'darkslateblue';
				ctx.lineWidth = 3;
				ctx.stroke(path2D);

				ctx.strokeStyle = '';
				ctx.lineWidth = 0;
			},
		).layer(
			// Parallel bezier curves
			(path2D) => {
				const bezier = [
					[ startVec.x, startVec.y ],
					[ mid1Vec.x, mid1Vec.y ],
					[ mid2Vec.x, mid2Vec.y ],
					[ stopVec.x, stopVec.y ],
				] as Bezier;

				drawParallelBezierCurve(path2D, bezier, 2);
				drawParallelBezierCurve(path2D, bezier, -2);
			},
			(ctx, path2D) => {
				//ctx.strokeStyle = 'rgb(67, 63, 54)';
				ctx.strokeStyle = 'goldenrod';
				ctx.lineWidth = 2;
				ctx.stroke(path2D);

				ctx.strokeStyle = '';
				ctx.lineWidth = 0;
			},
		);

		return path;
	}

	protected mapConnectionPath2Ds() {
		const nodes = this.data.nodes;
		const connections = this.data.connections;

		for (const con of connections.values()) {
			const outsideStart = isOutsideViewport(this.mainView.viewport, con.start);
			const outsideMid1  = isOutsideViewport(this.mainView.viewport, con.m1);
			const outsideMid2  = isOutsideViewport(this.mainView.viewport, con.m2);
			const outsideStop  = isOutsideViewport(this.mainView.viewport, con.stop);
			if (outsideStart && outsideStop && outsideMid1 && outsideMid2)
				continue;

			if (con.path.empty)
				this.createConnectionPath2D(nodes, con, con.path);

			con.path.draw(this.mainView.context);
		}
	}

	protected createNodePath2D(node: GraphNode, path: Canvas2DObject) {
		path.layer(
			(path2D) => {
				path2D.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
			},
			(ctx, path2D) => {
				if (!node.data) {
					ctx.strokeStyle = 'white';
					ctx.lineWidth = 2;
					ctx.stroke(path2D);
				}

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

	protected mapNodePath2Ds() {
		const nodes = this.data.nodes;

		for (const node of nodes.values()) {
			if (isOutsideViewport(this.mainView.viewport, node))
				continue;

			if (node.path.empty)
				this.createNodePath2D(node, node.path);

			node.path.draw(this.mainView.context);
		}
	}

	protected drawMain() {
		this.mainView.clearContext();

		const percentage = this.mainView.visiblePercentage;
		if (percentage < 50)
			this.mapConnectionPath2Ds();

		if (percentage < 50)
			this.mapNodePath2Ds();
	}

}
