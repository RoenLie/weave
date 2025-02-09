import type { Repeat, Vec2 } from '@roenlie/core/types';
import { Connection, GraphNode, type StorableConnection, type StorableGraphNode } from '../../app/graph.ts';
import { isOutsideViewport } from '../../app/is-outside-viewport.ts';
import { Canvas2DObject } from './canvas-object.ts';
import { oneOf } from '@roenlie/core/validation';
import { maybe } from '@roenlie/core/async';
import { PoeCanvasPassiveBase } from './canvas-passive-base.ts';


export class PoeCanvasTree extends PoeCanvasPassiveBase {

	static { this.register('poe-canvas-editor'); }

	protected updated?:      number;
	protected saveOngoing:   boolean = false;
	protected saveInterval?: ReturnType<typeof setInterval>;

	protected editingFeatures = {
		moveNode:        false,
		createNode:      false,
		resizeNodes:     false,
		deleteNodes:     false,
		connectNodes:    true,
		moveConnections: true,
	};

	protected override async afterConnected(): Promise<void> {
		await super.afterConnected();

		this.addEventListener('keydown', this.onKeydown);
		this.saveInterval = setInterval(this.save.bind(this), 5000);
	}

	protected override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.removeEventListener('keydown', this.onKeydown);

		clearInterval(this.saveInterval);
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

	protected override onMousedown(downEv: MouseEvent) {
		// We only care about left clicks
		if (downEv.buttons !== 1)
			return;

		downEv.preventDefault();
		this.focus();

		const rect = this.getBoundingClientRect();
		const deltaY = rect.top;
		const deltaX = rect.left;

		// Get the offset from the corner of the current view to the mouse position
		const viewOffsetX = downEv.offsetX - this.mainView.position.x;
		const viewOffsetY = downEv.offsetY - this.mainView.position.y;

		// Get the mouse position in relation to the current view
		const scale = this.mainView.scale;
		const realX = viewOffsetX / scale;
		const realY = viewOffsetY / scale;

		const vec = { x: downEv.offsetX, y: downEv.offsetY };
		// Try to find a node or connection at the mouse position
		const nodeOrVec = this.getGraphNode(vec) ?? this.getConnectionHandle(vec);

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
				if (downEv.shiftKey && this.editingFeatures.connectNodes) {
					this.connectNodes(this.selectedNode, nodeOrVec);
				}
				else {
					if (this.selectedNode?.path) {
						const node = this.selectedNode;
						this.selectedNode = undefined;
						node.path = this.createNodePath2D(node);
					}

					this.selectedNode = nodeOrVec;
					nodeOrVec.path = this.createNodePath2D(nodeOrVec);
				}

				this.drawMainCanvas.debounced();

				this.editingFeatures.moveNode && (mousemove = (ev: MouseEvent) => {
					const scale = this.mainView.scale;

					const x = ev.offsetX - deltaX - this.mainView.position.x - mouseOffsetX;
					const y = ev.offsetY - deltaY - this.mainView.position.y - mouseOffsetY;
					nodeOrVec.x = x / scale;
					nodeOrVec.y = y / scale;

					nodeOrVec.path = this.createNodePath2D(nodeOrVec);

					for (const con of nodeOrVec.connections) {
						const point = con.start.id === nodeOrVec.id
							? con.start
							: con.stop;

						point.x = nodeOrVec.x;
						point.y = nodeOrVec.y;

						con.path = this.createConnectionPath2D(this.nodes, con);
						con.pathHandle1 = this.createConnectionHandle2D(con, 1);
						con.pathHandle2 = this.createConnectionHandle2D(con, 2);
					}

					this.drawMainCanvas.debounced();
					this.updated = Date.now();
				});
			}
			else {
				const con = this.connections.values()
					.find(c => c.m1 === nodeOrVec || c.m2 === nodeOrVec);

				if (!con)
					return;

				this.editingFeatures.moveConnections && (mousemove = (ev: MouseEvent) => {
					const scale = this.mainView.scale;

					const x = ev.offsetX - deltaX - this.mainView.position.x - mouseOffsetX;
					const y = ev.offsetY - deltaY - this.mainView.position.y - mouseOffsetY;
					nodeOrVec.x = x / scale;
					nodeOrVec.y = y / scale;

					con.path = this.createConnectionPath2D(this.nodes, con);
					con.pathHandle1 = this.createConnectionHandle2D(con, 1);
					con.pathHandle2 = this.createConnectionHandle2D(con, 2);

					this.drawMainCanvas.debounced();
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
			if (this.editingFeatures.createNode && (downEv.detail === 2 || downEv.altKey || downEv.metaKey)) {
				const node = new GraphNode({ x: realX, y: realY });

				if (this.selectedNode?.path) {
					const node = this.selectedNode;
					this.selectedNode = undefined;
					node.path = this.createNodePath2D(node);
				}

				this.selectedNode = node;
				this.nodes.set(node.id, node);
				this.updated = Date.now();
				this.drawMainCanvas.debounced();
			}

			// We setup the mousemove and mouseup events
			// For panning the view
			const mousemove = (moveEv: MouseEvent) => {
				const x = moveEv.offsetX - deltaX - viewOffsetX;
				const y = moveEv.offsetY - deltaY - viewOffsetY;

				this.bgView.moveTo(x, y);
				this.mainView.moveTo(x, y);

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

				node.path = this.createNodePath2D(node);
				this.updated = Date.now();
			}
			else if (this.editingFeatures.deleteNodes && ev.code === 'Delete') {
				node.connections.forEach(con => this.connections.delete(con.id));
				this.nodes.delete(node.id);
				this.updated = Date.now();
			}
			else if (ev.code === 'Escape') {
				this.selectedNode = undefined;
				node.path = this.createNodePath2D(node);
			}

			this.drawMainCanvas.debounced();
		}
	};

	/** If found, returns the handle vector at the mouse position. */
	protected getConnectionHandle(vec: Vec2): Vec2 | undefined {
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

	protected createConnectionHandle2D(con: Connection, handle: 1 | 2) {
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
		for (const con of this.connections.values()) {
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
		super.drawMain();

		if (this.mainView.visiblePercentage < 1)
			this.mapConnectionHandle2Ds();
	}

	protected override render(): unknown {
		return super.render();
	}

	//public static override styles: CSSStyle = css`
	//	:host {
	//		contain: strict;
	//		display: grid;
	//		outline: none;
	//	}
	//	canvas {
	//		grid-row: 1/2;
	//		grid-column: 1/2;
	//	}
	//`;

}
