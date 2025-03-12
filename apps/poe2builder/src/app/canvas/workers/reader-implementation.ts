import { range } from '@roenlie/core/array';
import type { Repeat, Vec2 } from '@roenlie/core/types';
import { GraphDataManager, SupabaseGraphRepository } from '../../../pages/canvas-editor/data-manager.ts';
import { type StorableGraphNode, GraphNode } from '../../graph/graph-node.ts';
import { Canvas2DObject } from '../canvas-object.ts';
import { getWorkerImageChunk } from './worker-image-assets.ts';
import { isOutsideViewport, type Viewport } from '../is-outside-viewport.ts';
import { drawParallelBezierCurve, type Bezier } from '../parallel-bezier-curve.ts';
import { doRectsOverlap, getPathReduction } from '../path-helpers.ts';
import { type TransferableMouseEvent, type TransferableTouchEvent, type TransferableTouches, type WorkerImplement, createPostMessage } from './canvas-worker-interface.ts';
import { createClient, type Session } from '@supabase/supabase-js';
import type { GraphConnection } from '../../graph/graph-connection.ts';
import { WorkerView } from '@roenlie/core/canvas';


// Web workers don't have access to local storage.
// Therefor we need to provide a storage object to the Supabase client.
const workerStorage = new Map();
const storageKey = 'supabase.auth.token';
const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY,
	{
		auth: {
			storageKey,
			detectSessionInUrl: false,
			storage:            {
				getItem:	   (key: string) => workerStorage.get(key),
				setItem:	   (key: string, value: any) => void workerStorage.set(key, value),
				removeItem: (key: string) => void workerStorage.delete(key),
			},
		},
	},
);


/** Functions available from the main thread to the worker. */
export interface CanvasReaderWorkerApiIn {
	ready: {
		type: 'ready'
	}
	init: {
		type:    'init',
		main:    OffscreenCanvas,
		session: Session
	};
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


export class CanvasWorkerReader
implements WorkerImplement<CanvasReaderWorkerApiIn> {

	constructor() { this.ready(); }

	protected readonly supabase = supabase;
	protected readonly data = new GraphDataManager(new SupabaseGraphRepository());
	protected readonly post = createPostMessage<CanvasReaderWorkerApiOut>();

	protected view: WorkerView;

	protected imageSize:     number = 13000;
	protected chunkSize:     number = 1300;
	protected imagePromises: Map<string, Promise<any>> = new Map();
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
	public ready() {
		postMessage({ type: 'ready' });
	}

	public async init(data: CanvasReaderWorkerApiIn['init']) {
		workerStorage.set(storageKey, data.session);

		this.view = new WorkerView(data.main);

		await this.data.load();
		this.draw();
	}

	public setSize(data: CanvasReaderWorkerApiIn['setSize']) {
		this.view.setCanvasSize(data.width, data.height);

		this.draw();
	}

	public setArea(data: CanvasReaderWorkerApiIn['setArea']) {
		this.view.setTotalArea(data.width, data.height);

		this.draw();
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
		const parentWidth = this.view.canvas.width;
		const parentHeight = this.view.canvas.height;
		const y = parentHeight / 2 - imageSize / 2;
		const x = parentWidth  / 2 - imageSize  / 2;

		this.view.moveTo(x, y);

		this.draw();
	}

	public moveTo(data: CanvasReaderWorkerApiIn['moveTo']) {
		this.view.moveTo(data.x, data.y);

		this.draw();
	}

	public scaleAt(data: CanvasReaderWorkerApiIn['scaleAt']) {
		this.view.scaleAt(data.vec, data.factor);

		this.draw();
	}

	public mousedown(data: CanvasReaderWorkerApiIn['mousedown']) {
		const event = data.event;

		// Get the offset from the corner of the current view to the mouse position
		const position = this.view.position;
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
				position: this.view.position,
				viewport: this.view.viewport,
				scale:    this.view.scaleFactor,
			});

			this.draw();
		}

		// Add the hover effect if a node is hovered
		if (node && node !== this.hoveredNode) {
			this.hoveredNode = node;
			node.path.clear();

			this.post.enterNode({
				node:     GraphNode.toStorable(node),
				position: this.view.position,
				viewport: this.view.viewport,
				scale:    this.view.scaleFactor,
			});

			this.draw();
		}
	}

	public touchstart(data: CanvasReaderWorkerApiIn['touchstart']) {
		const offsetX = data.touches[0]!.pageX - data.rect.left;
		const offsetY = data.touches[0]!.pageY - data.rect.top;

		// Get the offset from the corner of the current view to the mouse position
		const position = this.view.position;
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
				scale:         this.view.scaleFactor,
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

			const isInPath = node.path.isPointInPath(this.view.context, vec.x, vec.y);
			if (isInPath)
				return node;
		}
	}

	protected isImgInView(img: Vec2) {
		const { x: dx1, y: dy1 } = img;
		const dx2 = dx1 + this.chunkSize;
		const dy2 = dy1 + this.chunkSize;

		const { x1, x2, y1, y2 } = this.view.viewport;

		return doRectsOverlap([ dx1, dy1, dx2, dy2 ], [ x1, y1, x2, y2 ]);
	}

	protected releaseDistantImages() {
		const viewport = this.view.viewport;

		// Use a larger buffer than just the visible area
		const bufferFactor = 3;
		const expandedVp = {
			x1: viewport.x1 - bufferFactor * this.chunkSize,
			y1: viewport.y1 - bufferFactor * this.chunkSize,
			x2: viewport.x2 + bufferFactor * this.chunkSize,
			y2: viewport.y2 + bufferFactor * this.chunkSize,
		};

		for (const img of this.images) {
			if (img.image) {
				const imgRect: Repeat<4, number> = [ img.x, img.y, img.x + this.chunkSize, img.y + this.chunkSize ];
				const vpRect: Repeat<4, number> = [ expandedVp.x1, expandedVp.y1, expandedVp.x2, expandedVp.y2 ];

				// Release this image's memory
				if (!doRectsOverlap(imgRect, vpRect))
					img.image = undefined;
			}
		}
	}

	protected createConnectionPath2D(con: GraphConnection, path: Canvas2DObject) {
		const startVec = { ...con.start };
		const stopVec  = { ...con.stop };
		const mid1Vec  = { ...con.m1 };
		const mid2Vec  = { ...con.m2 };

		const nodes = this.data.nodes;
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
		const connections = this.data.connections;

		for (const con of connections.values()) {
			const outsideStart = isOutsideViewport(this.view.viewport, con.start);
			const outsideMid1  = isOutsideViewport(this.view.viewport, con.m1);
			const outsideMid2  = isOutsideViewport(this.view.viewport, con.m2);
			const outsideStop  = isOutsideViewport(this.view.viewport, con.stop);
			if (outsideStart && outsideStop && outsideMid1 && outsideMid2)
				continue;

			if (con.path.empty)
				this.createConnectionPath2D(con, con.path);

			con.path.draw(this.view.context);
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
			if (isOutsideViewport(this.view.viewport, node))
				continue;

			if (node.path.empty)
				this.createNodePath2D(node, node.path);

			node.path.draw(this.view.context);
		}
	}

	protected drawBackground() {
		// Collect visible images that need loading
		const visibleImagesToLoad = this.images.filter(
			img => this.isImgInView(img) && !img.image && !this.imagePromises.has(`x${ img.x }y${ img.y }`),
		);

		// Sort images by distance to viewport center for priority loading
		if (visibleImagesToLoad.length > 0) {
			const viewport = this.view.viewport;
			const centerX = (viewport.x1 + viewport.x2) / 2;
			const centerY = (viewport.y1 + viewport.y2) / 2;

			visibleImagesToLoad.sort((a, b) => {
				// Calculate distance from center of viewport
				const distA = Math.hypot(a.x + this.chunkSize / 2 - centerX, a.y + this.chunkSize / 2 - centerY);
				const distB = Math.hypot(b.x + this.chunkSize / 2 - centerX, b.y + this.chunkSize / 2 - centerY);

				// Closest first
				return distA - distB;
			});

			// Limit batch size to prevent overwhelming the browser
			const batchSize = 4;
			const imagesToLoadNow = visibleImagesToLoad.slice(0, batchSize);

			// Start loading the selected images
			for (const image of imagesToLoadNow) {
				const imgId = `x${ image.x }y${ image.y }`;
				this.imagePromises.set(
					imgId,
					image.getImage().then(img => {
						image.image = img;
						this.imagePromises.delete(imgId);
						this.draw();
					}),
				);
			}
		}

		// Draw images that are already loaded
		for (const image of this.images) {
			if (!this.isImgInView(image) || !image.image)
				continue;

			this.view.context.drawImage(image.image, image.x, image.y);
		}

		// Optionally release images that are far outside viewport
		// Only do this when we have many loaded images to avoid constant loading/unloading
		const loadedImageCount = this.images.filter(img => img.image).length;
		const loadedImageLimit = 10;
		const zoomThreshold = 0.5;
		if (loadedImageCount > loadedImageLimit && this.view.scaleFactor >= zoomThreshold)
			this.releaseDistantImages();
	}

	protected draw() {
		this.view.clearContext();

		this.drawBackground();

		const percentage = this.view.visiblePercentage;
		if (percentage < 50)
			this.mapConnectionPath2Ds();

		if (percentage < 50)
			this.mapNodePath2Ds();
	}

}
