import type { Repeat, Vec2 } from '@roenlie/core/types';
import { isOutsideViewport, type Viewport } from './is-outside-viewport.ts';
import { GraphConnection, GraphNode, type GraphConnectionVec2, type StorableGraphNode, type StringVec2 } from '../graph/graph.ts';
import { range } from '@roenlie/core/array';
import { getWorkerImageChunk } from './image-assets.ts';
import { doRectsOverlap, getPathReduction } from './path-helpers.ts';
import { Canvas2DObject } from './canvas-object.ts';
import { drawParallelBezierCurve, type Bezier } from './parallel-bezier-curve.ts';
import { FirebaseGraphRepository, GraphDataManager } from '../../pages/canvas-editor/utils/data-manager.ts';
import { oneOf } from '@roenlie/core/validation';


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


type MakeObjectTransferable<T extends object> = {
	-readonly [Key in keyof T as T[Key] extends (string | number | boolean) ? Key : never]: T[Key];
};

export type TransferableMouseEvent = MakeObjectTransferable<MouseEvent>;
export type TransferableKeyboardEvent = MakeObjectTransferable<KeyboardEvent>;

export const makeObjectTransferable = <T extends object>(obj: T): MakeObjectTransferable<T> => {
	const cloned = {} as MakeObjectTransferable<T>;
	for (const key in obj) {
		const value = obj[key as keyof typeof obj]!;
		const type = typeof value;
		if (type === 'string' || type === 'number' || type === 'boolean')
			(cloned as any)[key] = value;
	}

	return cloned;
};


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
	}
	mousemove: {
		type:  'mousemove';
		event: TransferableMouseEvent;
	};
}

/** Functions available from the worker to the main thread. */
export interface CanvasReaderWorkerApiOut {
	updatePosition: {
		type:     'updatePosition',
		position: Vec2,
		viewport: Viewport,
		scale:    number,
	}
	startViewMove: {
		type:          'startViewMove',
		initialMouseX: number,
		initialMouseY: number,
		offsetX:       number,
		offsetY:       number,
	}
	selectNode: {
		type:   'selectNode',
		nodeId: string,
	}
	openTooltip: {
		type:   'openTooltip',
		nodeId: string,
		node:   StorableGraphNode;
	}
	closeTooltip: {
		type:   'closeTooltip',
		nodeId: string,
	}
}


type WorkerReaderMethods = {
	[key in keyof CanvasReaderWorkerApiIn]: (args: CanvasReaderWorkerApiIn[key]) => void;
};


export class CanvasWorkerReader implements WorkerReaderMethods {

	protected readonly data = new GraphDataManager(new FirebaseGraphRepository());

	protected bgView:        WorkerView;
	protected mainView:      WorkerView;
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

	//#region Message Handlers
	public onmessage(ev: MessageEvent<CanvasReaderWorkerApiIn[keyof CanvasReaderWorkerApiIn]>) {
		const fn = (this as any)[ev.data.type];
		if (typeof fn !== 'function')
			return console.error(`Unknown message type: ${ ev.data.type }`);

		(this as any)[ev.data.type]?.(ev.data);
	}

	public async init(data: {
		type: 'init',
		main: OffscreenCanvas,
		bg:   OffscreenCanvas
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

		postMessage({
			type:     'updatePosition',
			position: this.bgView.position,
			viewport: this.bgView.viewport,
			scale:    this.bgView.scale,
		} satisfies CanvasReaderWorkerApiOut['updatePosition']);

		this.drawBackground();
		this.drawMain();
	}

	public moveTo(data: CanvasReaderWorkerApiIn['moveTo']) {
		this.bgView.moveTo(data.x, data.y);
		this.mainView.moveTo(data.x, data.y);

		postMessage({
			type:     'updatePosition',
			position: this.bgView.position,
			viewport: this.bgView.viewport,
			scale:    this.bgView.scale,
		} satisfies CanvasReaderWorkerApiOut['updatePosition']);

		this.drawBackground();
		this.drawMain();
	}

	public scaleAt(data: CanvasReaderWorkerApiIn['scaleAt']) {
		this.bgView.scaleAt(data.vec, data.factor);
		this.mainView.scaleAt(data.vec, data.factor);

		postMessage({
			type:     'updatePosition',
			position: this.bgView.position,
			viewport: this.bgView.viewport,
			scale:    this.bgView.scale,
		} satisfies CanvasReaderWorkerApiOut['updatePosition']);

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

		// If we found a node, we want to move it
		if (node) {
			postMessage({
				type:   'selectNode',
				nodeId: node.id,
			} satisfies CanvasReaderWorkerApiOut['selectNode']);
		}
		// If we didn't find a node or a connection, we want to pan the view
		else {
			// We setup the mousemove and mouseup events
			// For panning the view
			postMessage({
				type:          'startViewMove',
				initialMouseX: event.offsetX,
				initialMouseY: event.offsetY,
				offsetX:       viewOffsetX,
				offsetY:       viewOffsetY,
			} satisfies CanvasReaderWorkerApiOut['startViewMove']);
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

			node.path = this.createNodePath2D(node);
			this.drawMain();

			postMessage({
				type:   'closeTooltip',
				nodeId: node.id,
			} satisfies CanvasReaderWorkerApiOut['closeTooltip']);
		}

		// Add the hover effect if a node is hovered
		if (node && node !== this.hoveredNode) {
			this.hoveredNode = node;
			this.hoveredNode.path = this.createNodePath2D(node);
			this.drawMain();

			postMessage({
				type:   'openTooltip',
				nodeId: node.id,
				node:   GraphNode.toStorable(node),
			} satisfies CanvasReaderWorkerApiOut['openTooltip']);
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
		const nodes = this.data.nodes;
		const connections = this.data.connections;

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
		const nodes = this.data.nodes;

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
	}

}


export interface CanvasEditorWorkerApiIn extends CanvasReaderWorkerApiIn {
	keydown: {
		type:  'keydown';
		event: TransferableKeyboardEvent;
	}
	moveNode: {
		type:          'moveNode';
		nodeId:        string;
		nodeX:         number;
		nodeY:         number;
		mouseX:        number;
		mouseY:        number;
		initialMouseX: number;
		initialMouseY: number;
		boundingX:     number;
		boundingY:     number;
		viewPositionX: number;
		viewPositionY: number;
		scale:         number;
	}
	moveHandle: {
		type:          'moveHandle';
		conId:         string;
		handle:        Omit<GraphConnectionVec2, 'connection'>;
		mouseX:        number;
		mouseY:        number;
		initialMouseX: number;
		initialMouseY: number;
		boundingX:     number;
		boundingY:     number;
		viewPositionX: number;
		viewPositionY: number;
		scale:         number;
	}
}

export interface CanvasEditorWorkerApiOut extends CanvasReaderWorkerApiOut {
	startNodeMove: {
		type:          'startNodeMove',
		nodeId:        string,
		nodeX:         number,
		nodeY:         number,
		initialMouseX: number,
		initialMouseY: number,
		viewPositionX: number,
		viewPositionY: number,
		scale:         number,
	}
	startHandleMove: {
		type:          'startHandleMove',
		conId:         string,
		handle:        Omit<GraphConnectionVec2, 'connection'>;
		initialMouseX: number,
		initialMouseY: number,
		viewPositionX: number,
		viewPositionY: number,
		scale:         number,
	}
}


type WorkerEditorMethods = {
	[key in keyof CanvasEditorWorkerApiIn]: (args: CanvasEditorWorkerApiIn[key]) => void;
};


export class CanvasWorkerEditor extends CanvasWorkerReader implements WorkerEditorMethods {

	protected editingFeatures = {
		moveNode:        false,
		createNode:      false,
		resizeNodes:     false,
		deleteNodes:     false,
		connectNodes:    true,
		moveConnections: true,
	};

	//#region Message Handlers
	public override mousedown(data: CanvasReaderWorkerApiIn['mousedown']) {
		const { event } = data;

		// Get the offset from the corner of the current view to the mouse position
		const position = this.bgView.position;
		const viewOffsetX = event.offsetX - position.x;
		const viewOffsetY = event.offsetY - position.y;

		const vec = { x: event.offsetX, y: event.offsetY };
		// Try to find a node at the mouse position
		const node = this.getGraphNode(vec);
		const conHandle = !node ? this.getConnectionHandle(vec) : undefined;

		// If we found a node, we want to move it
		if (node) {
			if (event.shiftKey)
				this.connectNodes(node);
			else
				this.selectNode(node.id);

			postMessage({
				type:          'startNodeMove',
				nodeId:        node.id,
				nodeX:         node.x,
				nodeY:         node.y,
				initialMouseX: event.offsetX,
				initialMouseY: event.offsetY,
				viewPositionX: this.bgView.position.x,
				viewPositionY: this.bgView.position.y,
				scale:         this.bgView.scale,
			} satisfies CanvasEditorWorkerApiOut['startNodeMove']);
		}
		else if (conHandle) {
			postMessage({
				type:          'startHandleMove',
				conId:         conHandle.connection.id,
				handle:        { index: conHandle.index, x: conHandle.x, y: conHandle.y },
				initialMouseX: event.offsetX,
				initialMouseY: event.offsetY,
				viewPositionX: this.bgView.position.x,
				viewPositionY: this.bgView.position.y,
				scale:         this.bgView.scale,
			} satisfies CanvasEditorWorkerApiOut['startHandleMove']);
		}
		// If we didn't find a node or a connection, we want to pan the view
		// and create a node if alt/cmd is pressed
		else {
			if (event.detail === 2 || event.altKey || event.metaKey)
				this.createNode(event);

			// We setup the mousemove and mouseup events for panning the view
			postMessage({
				type:          'startViewMove',
				initialMouseX: event.offsetX,
				initialMouseY: event.offsetY,
				offsetX:       viewOffsetX,
				offsetY:       viewOffsetY,
			} satisfies CanvasReaderWorkerApiOut['startViewMove']);
		}
	}

	public keydown(data: CanvasEditorWorkerApiIn['keydown']) {
		const event = data.event;
		const code = event.code;

		//if (event.key === 'Escape' && this.selectedNode) {
		//	const node = this.selectedNode;
		//	this.selectedNode = undefined;
		//	node.path = this.createNodePath2D(node);
		//	this.drawMain();
		//}

		if (this.selectedNode) {
			const node = this.selectedNode;

			if (oneOf(code, 'Digit1', 'Digit2', 'Digit3')) {
				if (code === 'Digit1')
					this.data.resizeNode(node, GraphNode.sizes[0]);
				else if (code === 'Digit2')
					this.data.resizeNode(node, GraphNode.sizes[1]);
				else if (code === 'Digit3')
					this.data.resizeNode(node, GraphNode.sizes[2]);

				node.path = this.createNodePath2D(node);
				node.connections.forEach(con => {
					con.path = this.createConnectionPath2D(this.data.nodes, con);
					con.pathHandle1 = this.createConnectionHandle2D(con, 1);
					con.pathHandle2 = this.createConnectionHandle2D(con, 2);
				});
			}
			else if (code === 'Delete') {
				this.data.deleteNode(node);
			}
			else if (code === 'Escape') {
				this.selectedNode = undefined;
				node.path = this.createNodePath2D(node);
			}

			this.drawMain();
		}
	}


	public moveNode(data: CanvasEditorWorkerApiIn['moveNode']) {
		const node = this.data.nodes.get(data.nodeId);
		if (!node)
			return console.error('Node not found');

		const {
			initialMouseX, initialMouseY,
			mouseX,        mouseY,
			boundingX,     boundingY,
			viewPositionX, viewPositionY,
			nodeX,         nodeY,
			scale,
		} = data;

		const viewOffsetX = initialMouseX - viewPositionX;
		const viewOffsetY = initialMouseY - viewPositionY;

		const realX = viewOffsetX / scale;
		const realY = viewOffsetY / scale;

		const mouseOffsetX = (realX - nodeX) * scale;
		const mouseOffsetY = (realY - nodeY) * scale;

		const x = (mouseX - boundingX - viewPositionX - mouseOffsetX) / scale;
		const y = (mouseY - boundingY - viewPositionY - mouseOffsetY) / scale;

		if (!this.data.moveNode(node, { x, y }))
			return;

		node.path = this.createNodePath2D(node);
		for (const con of node.connections) {
			con.path = this.createConnectionPath2D(this.data.nodes, con);
			con.pathHandle1 = this.createConnectionHandle2D(con, 1);
			con.pathHandle2 = this.createConnectionHandle2D(con, 2);
		}

		this.drawMain();
	}

	public moveHandle(data: CanvasEditorWorkerApiIn['moveHandle']) {
		const con = this.data.connections.get(data.conId);
		if (!con)
			return console.error('Connection not found');

		const conHandle = data.handle.index === 1
			? con.m1 : data.handle.index === 2
				? con.m2 : undefined;

		if (!conHandle)
			return console.error('Handle not found');

		const {
			initialMouseX, initialMouseY,
			mouseX,        mouseY,
			boundingX,     boundingY,
			viewPositionX, viewPositionY,
			handle,
			scale,
		} = data;

		const viewOffsetX = initialMouseX - viewPositionX;
		const viewOffsetY = initialMouseY - viewPositionY;

		const realX = viewOffsetX / scale;
		const realY = viewOffsetY / scale;

		const mouseOffsetX = (realX - handle.x) * scale;
		const mouseOffsetY = (realY - handle.y) * scale;

		const x = (mouseX - boundingX - viewPositionX - mouseOffsetX) / scale;
		const y = (mouseY - boundingY - viewPositionY - mouseOffsetY) / scale;

		if (!this.data.moveConnection(con, conHandle, { x, y }))
			return;

		con.path = this.createConnectionPath2D(this.data.nodes, con);
		con.pathHandle1 = this.createConnectionHandle2D(con, 1);
		con.pathHandle2 = this.createConnectionHandle2D(con, 2);

		this.drawMain();
	}
	//#endregion

	public selectNode(nodeId: string) {
		const node = this.data.nodes.get(nodeId);
		if (!node)
			return;

		if (this.selectedNode?.path) {
			const node = this.selectedNode;
			this.selectedNode = undefined;
			node.path = this.createNodePath2D(node);
		}

		this.selectedNode = node;
		node.path = this.createNodePath2D(node);

		this.drawMain();
	}

	protected createNode(event: TransferableMouseEvent) {
		const viewOffsetX = event.offsetX - this.bgView.position.x;
		const viewOffsetY = event.offsetY - this.bgView.position.y;

		const scale = this.bgView.scale;
		const realX = viewOffsetX / scale;
		const realY = viewOffsetY / scale;

		const node = this.data.addNode({ x: realX, y: realY });

		if (this.selectedNode?.path) {
			const node = this.selectedNode;
			this.selectedNode = undefined;
			node.path = this.createNodePath2D(node);
		}

		this.selectedNode = node;
		this.drawMain();
	}

	protected connectNodes(node: GraphNode) {
		this.data.connectNodes(this.selectedNode, node);

		this.drawMain();
	}

	/** If found, returns the handle vector at the mouse position. */
	protected getConnectionHandle(vec: Vec2): GraphConnectionVec2 | undefined {
		for (const [ , con ] of this.data.connections) {
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

	protected calculateConnectionAngle(start: Vec2, stop: Vec2) {
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

	protected createConnectionHandle2D(con: GraphConnection, handle: 1 | 2) {
		const vec2  = handle === 1 ? con.m1 : con.m2;
		const start = handle === 1 ? con.start : con.m1;
		const stop  = handle === 1 ? con.m2 : con.stop;

		const len = 6;
		const rawPoints = [
			{ x: vec2.x - len, y: vec2.y       },
			{ x: vec2.x,       y: vec2.y - len },
			{ x: vec2.x + len, y: vec2.y       },
			{ x: vec2.x,       y: vec2.y + len },
		];

		const points = this.rotateVertices(
			rawPoints, this.calculateConnectionAngle(start, stop), vec2,
		) as Repeat<4, Vec2>;

		const path = new Canvas2DObject();
		path.layer(
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

	protected mapConnectionHandle2Ds() {
		for (const con of this.data.connections.values()) {
			if (!isOutsideViewport(this.mainView.viewport, con.m1)) {
				con.pathHandle1 ??= this.createConnectionHandle2D(con, 1);
				con.pathHandle1.draw(this.mainView.context);
			}
			if (!isOutsideViewport(this.mainView.viewport, con.m2)) {
				con.pathHandle2 ??= this.createConnectionHandle2D(con, 2);
				con.pathHandle2.draw(this.mainView.context);
			}
		}
	}

	protected override drawMain() {
		this.mainView.clearContext();

		const percentage = this.mainView.visiblePercentage;
		if (percentage < 50)
			this.mapConnectionPath2Ds();

		if (percentage < 50)
			this.mapNodePath2Ds();

		if (this.mainView.visiblePercentage < 1)
			this.mapConnectionHandle2Ds();

		postMessage({ type: 'drawMain' });
	}

}
