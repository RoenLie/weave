import type { Vec2 } from '@roenlie/core/types';
import { isOutsideViewport, type Viewport } from './is-outside-viewport.ts';
import type { GraphConnection, GraphNode, StringVec2 } from '../graph/graph.ts';
import { range } from '@roenlie/core/array';
import { getWorkerBackgroundChunk } from '../../pages/canvas-editor/utils/image-assets.ts';
import { doRectsOverlap, getPathReduction } from './path-helpers.ts';
import { Canvas2DObject } from '../../pages/canvas-editor/utils/canvas-object.ts';
import { drawParallelBezierCurve, type Bezier } from './parallel-bezier-curve.ts';


class WorkerView {

	constructor(canvas: OffscreenCanvas) {
		this.canvas = canvas;
		this.context = this.canvas.getContext('2d')!;
	}

	public canvas:   OffscreenCanvas;
	public context:  OffscreenCanvasRenderingContext2D;
	public viewport: Viewport = { x1: 0, x2: 0, y1: 0, y2: 0 };
	public visiblePercentage = 0;

	protected totalArea = 0;
	protected viewportArea = 0;
	protected dirty: boolean = true;
	protected matrix = new DOMMatrix([ 1, 0, 0, 1, 0, 0 ]);

	public get position(): Vec2 { return this._position; }
	protected _position: Vec2 = { x: 0, y: 0 };

	public get scale(): number { return this._scale; }
	protected _scale: number = 1;

	/** Sets canvas width and height. */
	public setCanvasSize(width: number, height: number) {
		this.canvas.width = width;
		this.canvas.height = height;

		this.applyTransform();
	}

	/** Sets the total area, used for calculating visible area percentage. */
	public setTotalArea(width: number, height: number) {
		this.totalArea = width * height;
	}

	/** Resets the canvas transform, clears the canvas and reapplies the transform. */
	public clearContext() {
		const { width, height } = this.canvas;
		this.context.resetTransform();
		this.context.clearRect(0, 0, width, height);

		this.applyTransform();
	}

	/** set the 2D context transform to the view */
	public applyTransform() {
		const { matrix, context } = this;
		context.setTransform(matrix);

		this.updateViewport();
	};

	/** Calculates the current viewport dimensions for the view. */
	protected updateViewport(): void {
		const { x, y } = this._position;
		const { width, height } = this.canvas;

		const x1 = -x / this._scale;
		const y1 = -y / this._scale;
		const x2 = x1 + (width / this._scale);
		const y2 = y1 + (height / this._scale);

		this.viewport = { x1, x2, y1, y2 };

		this.viewportArea = (this.viewport.x2 - this.viewport.x1)
				* (this.viewport.y2 - this.viewport.y1);

		this.visiblePercentage = (this.viewportArea / this.totalArea) * 100;
	}

	/** Scales the context in the direction of the vector. */
	public scaleAt(vec: Vec2, factor: number) {
		this._scale *= factor;
		this._position.x = vec.x - (vec.x - this._position.x) * factor;
		this._position.y = vec.y - (vec.y - this._position.y) * factor;

		this.updateMatrix();
	};

	/** Translates the context. */
	public moveTo(x: number, y: number) {
		this._position.x = x;
		this._position.y = y;

		this.updateMatrix();
	};

	/** Applies the pending changes to the matrix. */
	public updateMatrix() {
		const { matrix: m, _scale, _position } = this;

		m.d = m.a = _scale;
		m.c = m.b = 0;
		m.e = _position.x;
		m.f = _position.y;
	};

}


/** Functions available from the main thread to the worker. */
export interface CanvasWorkerApiIn {
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
	transferNodes: {
		type:  'transferNodes',
		nodes: Map<string, GraphNode>
	};
	transferConnections: {
		type:        'transferConnections',
		connections: Map<string, GraphConnection>
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
	getPosition: {
		type: 'getPosition',
		id:   number
	};
	mousedown: {
		type:     'mousedown';
		buttons:  number;
		offsetX:  number;
		offsetY:  number;
		altKey:   boolean;
		ctrlKey:  boolean;
		metaKey:  boolean;
		shiftKey: boolean;
	}
	mousemove: {
		type:     'mousemove';
		offsetX:  number;
		offsetY:  number;
		altKey:   boolean;
		ctrlKey:  boolean;
		metaKey:  boolean;
		shiftKey: boolean;
	};
	draw: {
		type: 'draw'
	};
}

/** Functions available from the worker to the main thread. */
export interface CanvasWorkerApiOut {}


export class CanvasWorkerReader {

	protected bgView:        WorkerView;
	protected mainView:      WorkerView;
	protected nodes:         Map<string, GraphNode>;
	protected connections:   Map<string, GraphConnection>;
	protected imageSize:     number = 13000;
	protected chunkSize:     number = 1300;
	protected imagePromises: Map<StringVec2, Promise<any>> = new Map();
	protected images:        {
		x:        number,
		y:        number;
		image:    ImageBitmap | undefined;
		getImage: () => Promise<ImageBitmap>;
	}[] = [];

	protected selectedNode: GraphNode | undefined;
	protected hoveredNode:  GraphNode | undefined;

	public onmessage(ev: MessageEvent<CanvasWorkerApiIn[keyof CanvasWorkerApiIn]>) {
		const fn = (this as any)[ev.data.type];
		if (typeof fn !== 'function')
			return console.error(`Unknown message type: ${ ev.data.type }`);

		(this as any)[ev.data.type]?.(ev.data);
	}

	//#region Message Handlers
	protected init(data: {
		type: 'init',
		main: OffscreenCanvas,
		bg:   OffscreenCanvas
	}) {
		this.bgView = new WorkerView(data.bg);
		this.mainView = new WorkerView(data.main);
	}

	protected setSize(data: CanvasWorkerApiIn['setSize']) {
		this.bgView.setCanvasSize(data.width, data.height);
		this.mainView.setCanvasSize(data.width, data.height);

		this.drawBackground();
		this.drawMain();
	}

	protected setArea(data: CanvasWorkerApiIn['setArea']) {
		this.bgView.setTotalArea(data.width, data.height);
		this.mainView.setTotalArea(data.width, data.height);
	}

	protected transferNodes(data: CanvasWorkerApiIn['transferNodes']) {
		this.nodes = data.nodes;
	}

	protected transferConnections(data: CanvasWorkerApiIn['transferConnections']) {
		this.connections = data.connections;
	}

	protected initBackground(_data: CanvasWorkerApiIn['initBackground']) {
		this.images = range(0, 100).map(i => {
			return {
				x:        (i % 10) * this.chunkSize,
				y:        Math.floor(i / 10) * this.chunkSize,
				image:    undefined,
				getImage: () => getWorkerBackgroundChunk(i),
			};
		});

		const imageSize = this.imageSize;
		const parentWidth = this.bgView.canvas.width;
		const parentHeight = this.bgView.canvas.height;
		const y = parentHeight / 2 - imageSize / 2;
		const x = parentWidth  / 2 - imageSize  / 2;

		this.bgView.moveTo(x, y);
		this.mainView.moveTo(x, y);

		postMessage({
			type:     'update-position',
			position: this.bgView.position,
			viewport: this.bgView.viewport,
			scale:    this.bgView.scale,
		});

		this.drawBackground();
		this.drawMain();
	}

	protected moveTo(data: CanvasWorkerApiIn['moveTo']) {
		this.bgView.moveTo(data.x, data.y);
		this.mainView.moveTo(data.x, data.y);

		postMessage({
			type:     'update-position',
			position: this.bgView.position,
			viewport: this.bgView.viewport,
			scale:    this.bgView.scale,
		});

		this.drawBackground();
		this.drawMain();
	}

	protected scaleAt(data: CanvasWorkerApiIn['scaleAt']) {
		this.bgView.scaleAt(data.vec, data.factor);
		this.mainView.scaleAt(data.vec, data.factor);

		postMessage({
			type:     'update-position',
			position: this.bgView.position,
			viewport: this.bgView.viewport,
			scale:    this.bgView.scale,
		});

		this.drawBackground();
		this.drawMain();
	}

	protected getPosition(data: CanvasWorkerApiIn['getPosition']) {
		postMessage({ id: data.id, position: this.bgView.position });
	}

	protected mousedown(data: CanvasWorkerApiIn['mousedown']) {
		// Get the offset from the corner of the current view to the mouse position
		const position = this.bgView.position;
		const viewOffsetX = data.offsetX - position.x;
		const viewOffsetY = data.offsetY - position.y;

		const vec = { x: data.offsetX, y: data.offsetY };
		// Try to find a node at the mouse position
		const node = this.getGraphNode(vec);

		// If we found a node, we want to move it
		if (node) {
			// We are clicking on a node
			if (this.selectedNode?.path) {
				const node = this.selectedNode;
				this.selectedNode = undefined;
				node.path = this.createNodePath2D(node);
			}

			this.selectedNode = node;
			node.path = this.createNodePath2D(node);

			this.drawMain();
		}
		// If we didn't find a node or a connection, we want to pan the view
		// and create a node if alt/cmd is pressed
		else {
			// We setup the mousemove and mouseup events
			// For panning the view
			postMessage({
				type:    'start-view-move',
				offsetX: viewOffsetX,
				offsetY: viewOffsetY,
			});
		}
	}

	protected mousemove(data: CanvasWorkerApiIn['mousemove']) {
		const vec = { x: data.offsetX, y: data.offsetY };
		const node = this.getGraphNode(vec);

		if (data.altKey || data.metaKey)
			return;

		// Remove the hover effect if no node, or a new node is hovered
		if (this.hoveredNode && node !== this.hoveredNode) {
			const node = this.hoveredNode;

			this.hoveredNode = undefined;

			node.path = this.createNodePath2D(node);
			this.drawMain();

			postMessage({ type: 'close-tooltip', nodeId: node.id });
		}

		// Add the hover effect if a node is hovered
		if (node && node !== this.hoveredNode) {
			this.hoveredNode = node;
			this.hoveredNode.path = this.createNodePath2D(node);
			this.drawMain();

			postMessage({ type: 'open-tooltip', nodeId: node.id });
		}
	}

	protected draw(_data: CanvasWorkerApiIn['draw']) {
		this.bgView.applyTransform();
	}
	//#endregion

	protected getGraphNode(vec: Vec2): GraphNode | undefined {
		const nodes = this.nodes;

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

			const imgId = `x${ image.x }y${ image.y }` as StringVec2;
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

	protected createConnectionPath2D(nodes: Map<string, GraphNode>, con: GraphConnection) {
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

		const path = new Canvas2DObject();
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
		const nodes = this.nodes;
		const connections = this.connections;

		for (const con of connections.values()) {
			const outsideStart = isOutsideViewport(this.mainView.viewport, con.start);
			const outsideMid1  = isOutsideViewport(this.mainView.viewport, con.m1);
			const outsideMid2  = isOutsideViewport(this.mainView.viewport, con.m2);
			const outsideStop  = isOutsideViewport(this.mainView.viewport, con.stop);
			if (outsideStart && outsideStop && outsideMid1 && outsideMid2)
				continue;

			con.path ??= this.createConnectionPath2D(nodes, con);
			con.path.draw(this.mainView.context);
		}
	}

	protected createNodePath2D(node: GraphNode) {
		const path = new Canvas2DObject();
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
		const nodes = this.nodes;

		for (const node of nodes.values()) {
			if (isOutsideViewport(this.mainView.viewport, node))
				continue;

			node.path ??= this.createNodePath2D(node);
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

		postMessage({ type: 'drawMain' });
	}

}

export class CanvasWorkerEditor extends CanvasWorkerReader {

}
