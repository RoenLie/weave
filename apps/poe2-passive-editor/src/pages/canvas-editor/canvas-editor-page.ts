import type { Repeat, Vec2 } from '@roenlie/core/types';
import { GraphConnection, GraphNode } from '../../app/graph/graph.ts';
import { isOutsideViewport } from '../../app/canvas/is-outside-viewport.ts';
import { Canvas2DObject } from './utils/canvas-object.ts';
import { oneOf } from '@roenlie/core/validation';
import { PoeCanvasBase } from './canvas-base.ts';
import { html } from 'lit-html';
import { when } from 'lit-html/directives/when.js';
import { css, signal, type CSSStyle } from '../../app/custom-element/signal-element.ts';
import { nodeDataCatalog, type NodeData, type NodeDataCatalog } from '../../app/graph/node-catalog.ts';
import { map } from 'lit-html/directives/map.js';
import { FirebaseGraphRepository, GraphDataManager } from './utils/data-manager.ts';
import { View } from '../../app/canvas/canvas-view.ts';


export class PoeCanvasTree extends PoeCanvasBase {

	static { this.register('poe-canvas-editor'); }

	@signal protected accessor selectedNodeMenu: keyof NodeDataCatalog | undefined = undefined;
	@signal protected accessor showNodeSelectorMenu: boolean = false;

	protected readonly bgView:   View = new View();
	protected readonly mainView: View = new View();

	protected override dataManager = new GraphDataManager(
		new FirebaseGraphRepository(),
	);

	protected nodeSelectorMenus = [
		'minor',
		'notable',
		'keystone',
	] as const;

	protected editingFeatures = {
		moveNode:        false,
		createNode:      false,
		resizeNodes:     false,
		deleteNodes:     false,
		connectNodes:    true,
		moveConnections: true,
	};

	protected override async afterDataLoaded(): Promise<void> {
		super.afterDataLoaded();

		this.addEventListener('keydown', this.onKeydown);
	}

	protected getGraphNode(vec: Vec2): GraphNode | undefined {
		const { nodes } = this.dataManager;

		// If found, returns the node at the mouse position.
		for (const [ , node ] of nodes) {
			if (!node.path)
				continue;

			const isInPath = node.path.isPointInPath(this.mainView.context, vec.x, vec.y);
			if (isInPath)
				return node;
		}
	}

	protected override onMousedown(downEv: MouseEvent) {
		// We only care about left clicks
		if (downEv.buttons !== 1)
			return;

		downEv.preventDefault();
		this.focus();

		const { connections } = this.dataManager;

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
				const node = nodeOrVec;

				if (downEv.shiftKey && this.editingFeatures.connectNodes) {
					this.dataManager.connectNodes(this.selectedNode, node);
				}
				else {
					if (this.selectedNode?.path) {
						const node = this.selectedNode;
						this.selectedNode = undefined;
						node.path = this.createNodePath2D(node);
					}

					this.selectedNode = node;
					node.path = this.createNodePath2D(node);
				}

				this.drawMain();

				this.editingFeatures.moveNode && (mousemove = (ev: MouseEvent) => {
					const scale = this.mainView.scale;
					const x = ev.offsetX - deltaX - this.mainView.position.x - mouseOffsetX;
					const y = ev.offsetY - deltaY - this.mainView.position.y - mouseOffsetY;

					this.dataManager.moveNode(node, { x: x / scale, y: y / scale });
					this.drawMain();
				});
			}
			else {
				const vec = nodeOrVec;
				const con = connections.values().find(c => c.m1 === vec || c.m2 === vec);
				if (!con)
					return;

				this.editingFeatures.moveConnections && (mousemove = (ev: MouseEvent) => {
					const scale = this.mainView.scale;

					const x = ev.offsetX - deltaX - this.mainView.position.x - mouseOffsetX;
					const y = ev.offsetY - deltaY - this.mainView.position.y - mouseOffsetY;

					this.dataManager.moveConnection(con, vec, { x: x / scale, y: y / scale });
					this.drawMain();
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
				const node = this.dataManager.addNode({ x: realX, y: realY });

				if (this.selectedNode?.path) {
					const node = this.selectedNode;
					this.selectedNode = undefined;
					node.path = this.createNodePath2D(node);
				}

				this.selectedNode = node;
				this.drawMain();
			}

			// We setup the mousemove and mouseup events
			// For panning the view
			const mousemove = (moveEv: MouseEvent) => {
				const x = moveEv.offsetX - deltaX - viewOffsetX;
				const y = moveEv.offsetY - deltaY - viewOffsetY;

				this.bgView.moveTo(x, y);
				this.mainView.moveTo(x, y);

				this.drawBackground();
				this.drawMain();
			};
			const mouseup = () => {
				removeEventListener('mousemove', mousemove);
				removeEventListener('mouseup', mouseup);
			};

			addEventListener('mousemove', mousemove);
			addEventListener('mouseup', mouseup);
		}
	}

	protected onKeydown(ev: KeyboardEvent) {
		if (this.selectedNode) {
			const node = this.selectedNode;

			if (this.editingFeatures.resizeNodes && oneOf(ev.code, 'Digit1', 'Digit2', 'Digit3')) {
				if (ev.code === 'Digit1')
					this.dataManager.resizeNode(node, node.sizes[0]!);
				else if (ev.code === 'Digit2')
					this.dataManager.resizeNode(node, node.sizes[1]!);
				else if (ev.code === 'Digit3')
					this.dataManager.resizeNode(node, node.sizes[2]!);
			}
			else if (this.editingFeatures.deleteNodes && ev.code === 'Delete') {
				this.dataManager.deleteNode(node);
			}
			else if (ev.code === 'Escape') {
				this.selectedNode = undefined;
				node.path = this.createNodePath2D(node);
			}

			this.drawMain();
		}
	};

	/** If found, returns the handle vector at the mouse position. */
	protected getConnectionHandle(vec: Vec2): Vec2 | undefined {
		const { connections } = this.dataManager;

		for (const [ , con ] of connections) {
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
		const { connections } = this.dataManager;

		for (const con of connections.values()) {
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

	protected override _drawMain() {
		super._drawMain();

		if (this.mainView.visiblePercentage < 1)
			this.mapConnectionHandle2Ds();
	}

	protected override beforeCloseTooltip(): void {
		this.selectedNodeMenu = undefined;
	}

	protected assignNodeData(node: GraphNode, data: NodeData | undefined) {
		this.dataManager.updateNodeData(node, data);
		this.drawMain();
	}

	protected async onClickSave() {
		await this.dataManager.save();
		this.requestUpdate();
	}

	protected override renderTooltip(node: GraphNode): unknown {
		if (!node.data || this.showNodeSelectorMenu) {
			return html`
			<s-node-selector>
				<s-selector-header>
					Select node data to assign.
				</s-selector-header>

				${ when(this.selectedNodeMenu, () => html`
				<button @click=${ () => this.selectedNodeMenu = undefined }>
					<svg width="22px" height="22px" fill="currentColor">
						<use xlink:href="bootstrap-icons.svg#arrow-left"/>
					</svg>
				</button>
				`) }
				<ul>
					${ when(
						this.selectedNodeMenu,
						menu => html`
						<li @click=${ () => this.assignNodeData(node, undefined) }>
							~ clear ~
						</li>
						${ map(nodeDataCatalog[menu], data => html`
						<li @click=${ () => this.assignNodeData(node, data) }>
							${ data.id.replaceAll('_', ' ') }
						</li>
						`) }
						`,
						() => map(this.nodeSelectorMenus, (menu) => html`
						<li @click=${ () => this.selectedNodeMenu = menu }>${ menu }</li>
						`),
					) }
				</ul>
			</s-node-selector>
			`;
		}

		return html`
		<s-node-editor-tooltip>
			<button @click=${ () => { this.assignNodeData(node, undefined); } }>
				<svg width="22px" height="22px" fill="currentColor">
					<use xlink:href="bootstrap-icons.svg#x"/>
				</svg>
			</button>
			<div style="white-space:nowrap;">
				${ node.data.id }
			</div>
			<div>
				${ node.data.description }
			</div>
		</s-node-editor-tooltip>
		`;
	}

	protected override render(): unknown {
		return [
			super.render(),
			when(!this.dataManager.updated, () => html`
			<s-state-panel>
				<button @click=${ this.onClickSave }>
					Save
				</button>
			</s-state-panel>
			`),
		];
	}

	public static override styles: CSSStyle = css`
		s-state-panel {
			position: absolute;
			inset: 0;
			margin: auto;
			margin-top: 12px;
			width: fit-content;
			height: fit-content;
		}

		s-node-editor-tooltip {
			display: grid;
			background: rgb(241 194 50);
			color: black;
			border: 1px solid rgb(241 194 50);
			border-radius: 8px;
			padding: 8px;
			padding-top: 18px;

			button {
				position: absolute;
				top: 0px;
				right: 0px;
				padding: 0px;
				border: unset;
				background: none;
				cursor: pointer;
			}
		}

		s-node-selector ul { all: unset; }
		s-node-selector li { all: unset; }
		s-node-selector {
			display: grid;
			grid-template-rows: auto 1fr;
			grid-template-columns: auto 1fr;

			border: 1px solid rgb(241 194 50);
			background: rgb(241 194 50);
			color: black;

			padding-left: 8px;

			border-radius: 8px;
			border-top-right-radius: 2px;
			border-bottom-right-radius: 2px;

			min-width: 200px;
			width: fit-content;
			max-width: 600px;

			min-height: 50px;
			height: fit-content;
			max-height: 400px;

			s-selector-header {
				white-space: nowrap;
				display: block;
				grid-row: 1 / 2;
				grid-column: 1 / 3;
				padding-inline: 8px;
			}

			button {
				all: unset;
				grid-row: 2 / 3;
				grid-column: 1 / 2;
				cursor: pointer;
				padding-right: 8px;
				height: fit-content;
				place-self: center;
			}
			ul {
				rid-row: 2 / 3;
				grid-column: 2 / 3;
				display: flex;
				flex-flow: column;
				overflow-x: hidden;

				&::-webkit-scrollbar {
					width: 8px;
					height: 8px;
				}
				&::-webkit-scrollbar-track {
					background: transparent;
				}
				&::-webkit-scrollbar-thumb {
					background: rgb(30 30 30 / 50%);
					border-radius: 2px;
					-webkit-background-clip: padding-box;
					background-clip: padding-box;
				}
				&::-webkit-scrollbar-corner {
					background: rgba(0, 0, 0, 0);
				}
			}
			li {
				cursor: pointer;
				white-space: nowrap;

				&:hover {
					background: rgb(30 30 30 / 20%);
				}
			}
			s-separator {
				margin: 5px 0;
				border-top: 1px solid rgb(30 30 30 / 50%);
			}
		}
	`;

}
