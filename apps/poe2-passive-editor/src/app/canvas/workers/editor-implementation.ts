import type { Vec2, Repeat } from '@roenlie/core/types';
import { oneOf } from '@roenlie/core/validation';
import { type GraphConnectionVec2, GraphNode, type GraphConnection } from '../../graph/graph.ts';
import { allDataNodes } from '../../graph/node-catalog.ts';
import { Canvas2DObject } from '../canvas-object.ts';
import { isOutsideViewport } from '../is-outside-viewport.ts';
import { type TransferableKeyboardEvent, type WorkerImplement, createPostMessage, type TransferableMouseEvent } from './canvas-worker-interface.ts';
import { type CanvasReaderWorkerApiIn, type CanvasReaderWorkerApiOut, CanvasWorkerReader } from './reader-implementation.ts';


/** Functions available from the main thread to the worker. */
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
		rect:          DOMRect;
		position:      Vec2;
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
		rect:          DOMRect;
		position:      Vec2;
		scale:         number;
	}
	assignDataToNode: {
		type:   'assignDataToNode';
		nodeId: string;
		dataId: string | undefined;
	}
	saveData: {
		type: 'saveData'
	}
}

/** Functions available from the worker to the main thread. */
export interface CanvasEditorWorkerApiOut extends CanvasReaderWorkerApiOut {
	startNodeMove: {
		type:          'startNodeMove',
		nodeId:        string,
		nodeX:         number,
		nodeY:         number,
		initialMouseX: number,
		initialMouseY: number,
		position:      Vec2,
		scale:         number,
	}
	startHandleMove: {
		type:          'startHandleMove',
		conId:         string,
		handle:        Omit<GraphConnectionVec2, 'connection'>;
		initialMouseX: number,
		initialMouseY: number,
		position:      Vec2,
		scale:         number,
	}
	draw: {
		type: 'draw'
	},
	assignDataToNode: {
		type:   'assignDataToNode';
		nodeId: string;
		dataId: string | undefined;
	}
	dataUpdated: {
		type: 'dataUpdated'
	}
	dataSaved: {
		type: 'dataSaved'
	}
}


export class CanvasWorkerEditor extends CanvasWorkerReader implements WorkerImplement<CanvasEditorWorkerApiIn> {

	protected override readonly post = createPostMessage<CanvasEditorWorkerApiOut>();

	protected editingFeatures = {
		moveNode:        false,
		createNode:      false,
		resizeNodes:     false,
		deleteNodes:     false,
		connectNodes:    true,
		moveConnections: true,
	};

	//#region from main thread
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

			this.post.startNodeMove({
				nodeId:        node.id,
				nodeX:         node.x,
				nodeY:         node.y,
				initialMouseX: event.offsetX,
				initialMouseY: event.offsetY,
				//viewPositionX: this.bgView.position.x,
				//viewPositionY: this.bgView.position.y,
				position:      this.bgView.position,
				scale:         this.bgView.scale,
			});
		}
		else if (conHandle) {
			this.post.startHandleMove({
				conId:         conHandle.connection.id,
				handle:        { index: conHandle.index, x: conHandle.x, y: conHandle.y },
				initialMouseX: event.offsetX,
				initialMouseY: event.offsetY,
				//viewPositionX: this.bgView.position.x,
				//viewPositionY: this.bgView.position.y,
				position:      this.bgView.position,
				scale:         this.bgView.scale,
			});
		}
		// If we didn't find a node or a connection, we want to pan the view
		// and create a node if alt/cmd is pressed
		else {
			if (event.detail === 2 || event.altKey || event.metaKey)
				this.createNode(event);

			// We setup the mousemove and mouseup events for panning the view
			this.post.startViewMove({
				initialMouseX: event.offsetX,
				initialMouseY: event.offsetY,
				offsetX:       viewOffsetX,
				offsetY:       viewOffsetY,
			});
		}
	}

	public keydown(data: CanvasEditorWorkerApiIn['keydown']) {
		const event = data.event;
		const code = event.code;
		let updated = false;

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

				updated = true;
			}
			else if (code === 'Delete') {
				this.data.deleteNode(node);
				updated = true;
			}
			else if (code === 'Escape') {
				this.selectedNode = undefined;
				node.path = this.createNodePath2D(node);
			}
		}

		if (updated)
			this.post.dataUpdated({});

		this.drawMain();
	}

	public moveNode(data: CanvasEditorWorkerApiIn['moveNode']) {
		const node = this.data.nodes.get(data.nodeId);
		if (!node)
			return console.error('Node not found');


		const {
			initialMouseX,
			initialMouseY,
			mouseX,
			mouseY,
			nodeX,
			nodeY,
			rect,
			position,
			scale,
		} = data;

		const realX = (initialMouseX - position.x) / scale;
		const realY = (initialMouseY - position.y) / scale;

		const mouseOffsetX = (realX - nodeX) * scale;
		const mouseOffsetY = (realY - nodeY) * scale;

		const x = (mouseX - rect.x - position.x - mouseOffsetX) / scale;
		const y = (mouseY - rect.y - position.y - mouseOffsetY) / scale;

		if (!this.data.moveNode(node, { x, y }))
			return;

		node.path = this.createNodePath2D(node);
		for (const con of node.connections) {
			con.path = this.createConnectionPath2D(this.data.nodes, con);
			con.pathHandle1 = this.createConnectionHandle2D(con, 1);
			con.pathHandle2 = this.createConnectionHandle2D(con, 2);
		}

		this.post.dataUpdated({});

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
			initialMouseX,
			initialMouseY,
			mouseX,
			mouseY,
			rect,
			position,
			handle,
			scale,
		} = data;

		const viewOffsetX = initialMouseX - position.x;
		const viewOffsetY = initialMouseY - position.y;

		const realX = viewOffsetX / scale;
		const realY = viewOffsetY / scale;

		const mouseOffsetX = (realX - handle.x) * scale;
		const mouseOffsetY = (realY - handle.y) * scale;

		const x = (mouseX - rect.x - position.x - mouseOffsetX) / scale;
		const y = (mouseY - rect.y - position.y - mouseOffsetY) / scale;

		if (!this.data.moveConnection(con, conHandle, { x, y }))
			return;

		con.path = this.createConnectionPath2D(this.data.nodes, con);
		con.pathHandle1 = this.createConnectionHandle2D(con, 1);
		con.pathHandle2 = this.createConnectionHandle2D(con, 2);

		this.post.dataUpdated({});

		this.drawMain();
	}

	public assignDataToNode(data: CanvasEditorWorkerApiIn['assignDataToNode']) {
		const node = this.data.nodes.get(data.nodeId);
		if (!node)
			return;

		if (!data.dataId) {
			this.data.updateNodeData(node, undefined);
		}
		else {
			const nodeData = allDataNodes.get(data.dataId);
			if (!nodeData)
				return;

			this.data.updateNodeData(node, nodeData);
		}

		this.post.assignDataToNode({
			nodeId: node.id,
			dataId: data.dataId,
		});

		this.post.dataUpdated({});

		this.drawMain();
	};

	public async saveData() {
		if (this.data.updatedAt)
			return;

		if (await this.data.save())
			this.post.dataSaved({});
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

		this.post.dataUpdated({});

		this.drawMain();
	}

	protected connectNodes(node: GraphNode) {
		if (!this.data.connectNodes(this.selectedNode, node))
			return;

		this.post.dataUpdated({});

		this.drawMain();
	}

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

		this.post.draw({});
	}

}
