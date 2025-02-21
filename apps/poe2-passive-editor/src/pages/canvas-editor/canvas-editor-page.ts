import { GraphNode, type StorableGraphNode } from '../../app/graph/graph.ts';
import { PoeCanvasBase } from './canvas-base.ts';
import { html } from 'lit-html';
import { when } from 'lit-html/directives/when.js';
import { css, signal, type CSSStyle } from '../../app/custom-element/signal-element.ts';
import { allDataNodes, nodeDataCatalog, type NodeData, type NodeDataCatalog } from '../../app/graph/node-catalog.ts';
import { map } from 'lit-html/directives/map.js';
import CanvasWorkerEditor from '../../app/canvas/canvas-worker-editor.ts?worker';
import { createCanvasEditorWorker } from '../../app/canvas/canvas-worker-interface.ts';
import { makeObjectTransferable, type CanvasEditorWorkerApiOut } from '../../app/canvas/canvas-worker-base.ts';


export class PoeCanvasTree extends PoeCanvasBase {

	static { this.register('poe-canvas-editor'); }

	@signal protected accessor selectedNodeMenu: keyof NodeDataCatalog | undefined = undefined;
	@signal protected accessor showNodeSelectorMenu: boolean = false;
	@signal protected accessor updated: boolean = false;

	protected override readonly worker = createCanvasEditorWorker(CanvasWorkerEditor);
	protected readonly nodeSelectorMenus = [ 'minor', 'notable', 'keystone' ] as const;

	protected editingFeatures = {
		moveNode:        false,
		createNode:      false,
		resizeNodes:     false,
		deleteNodes:     false,
		connectNodes:    true,
		moveConnections: true,
	};

	protected override afterConnected(): void {
		super.afterConnected();

		this.addEventListener('keydown', this.onKeydown);
	}

	protected override onWorkerMessage(ev: MessageEvent) {
		super.onWorkerMessage(ev);

		this.onStartNodeMove(ev);
		this.onStartHandleMove(ev);
	}

	protected override onMousedown(downEv: MouseEvent) {
		if (downEv.buttons !== 1)
			return;

		downEv.preventDefault();
		this.focus();

		const event = makeObjectTransferable(downEv);
		this.worker.mousedown({ event });
	}

	protected onStartNodeMove(ev: MessageEvent<CanvasEditorWorkerApiOut['startNodeMove']>) {
		if (ev.data.type !== 'startNodeMove')
			return;

		const rect = this.getBoundingClientRect();

		const mousemove = (() => {
			let moveEv: MouseEvent = undefined as any;
			const fn = () => {
				this.worker.moveNode({
					...ev.data,
					mouseX:    moveEv.offsetX,
					mouseY:    moveEv.offsetY,
					boundingX: rect.left,
					boundingY: rect.top,
				});
			};

			return (ev: MouseEvent) => { moveEv = ev; requestAnimationFrame(fn); };
		})();

		const mouseup = () => {
			removeEventListener('mousemove', mousemove);
			removeEventListener('mouseup', mouseup);
		};

		addEventListener('mousemove', mousemove);
		addEventListener('mouseup', mouseup);
	}

	protected onStartHandleMove(ev: MessageEvent<CanvasEditorWorkerApiOut['startHandleMove']>) {
		if (ev.data.type !== 'startHandleMove')
			return;

		const rect = this.getBoundingClientRect();

		const mousemove = (() => {
			let moveEv: MouseEvent = undefined as any;
			const fn = () => {
				this.worker.moveHandle({
					...ev.data,
					mouseX:    moveEv.offsetX,
					mouseY:    moveEv.offsetY,
					boundingX: rect.left,
					boundingY: rect.top,
				});
			};

			return (ev: MouseEvent) => { moveEv = ev; requestAnimationFrame(fn); };
		})();
		const mouseup = () => {
			removeEventListener('mousemove', mousemove);
			removeEventListener('mouseup', mouseup);
		};
		addEventListener('mousemove', mousemove);
		addEventListener('mouseup', mouseup);
	}

	protected onKeydown(_ev: KeyboardEvent) {
		//if (this.selectedNode) {
		//	const node = this.selectedNode;

		//	if (this.editingFeatures.resizeNodes && oneOf(ev.code, 'Digit1', 'Digit2', 'Digit3')) {
		//		if (ev.code === 'Digit1')
		//			this.dataManager.resizeNode(node, node.sizes[0]!);
		//		else if (ev.code === 'Digit2')
		//			this.dataManager.resizeNode(node, node.sizes[1]!);
		//		else if (ev.code === 'Digit3')
		//			this.dataManager.resizeNode(node, node.sizes[2]!);
		//	}
		//	else if (this.editingFeatures.deleteNodes && ev.code === 'Delete') {
		//		this.dataManager.deleteNode(node);
		//	}
		//	else if (ev.code === 'Escape') {
		//		this.selectedNode = undefined;
		//		node.path = this.createNodePath2D(node);
		//	}

		//	this.drawMain();
		//}
	};

	protected override beforeCloseTooltip(): void {
		this.selectedNodeMenu = undefined;
	}

	protected assignNodeData(node: GraphNode, data: NodeData | undefined) {
		//this.dataManager.updateNodeData(node, data);
	}

	protected async onClickSave() {
		//await this.dataManager.save();
		this.requestUpdate();
	}

	protected override renderTooltip(node: StorableGraphNode): unknown {
		const data = allDataNodes.get(node.data)!;

		if (!data || this.showNodeSelectorMenu) {
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
				${ data.id }
			</div>
			<div>
				${ data.description }
			</div>
		</s-node-editor-tooltip>
		`;
	}

	protected override render(): unknown {
		return [
			super.render(),
			when(this.updated, () => html`
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
