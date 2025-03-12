import { type StorableGraphNode } from '../../app/graph/graph-node.ts';
import { PoeCanvasBase } from './canvas-base.ts';
import { html } from 'lit-html';
import { when } from 'lit-html/directives/when.js';
import { dataNodes, type NodeData } from '../../app/graph/node-catalog.ts';
import { map } from 'lit-html/directives/map.js';
import CanvasWorkerEditor from '../../app/canvas/workers/canvas-editor.ts?worker';
import { createCanvasWorker, makeObjectTransferable, type CanvasEditorWorkerMethods } from '../../app/canvas/workers/canvas-worker-interface.ts';
import type { CanvasEditorWorkerApiOut } from '../../app/canvas/workers/editor-implementation.ts';
import { css, state, type CSSStyle } from '@roenlie/custom-element';


export class PoeCanvasTree extends PoeCanvasBase {

	static { this.register('poe-canvas-editor'); }

	@state() protected accessor selectedNodeMenu: NodeData['type'] | undefined = undefined;
	@state() protected accessor showNodeSelectorMenu: boolean = false;
	@state() protected accessor updated: boolean = false;

	protected override worker: Worker & CanvasEditorWorkerMethods;
	protected readonly nodeSelectorMenus = [ 'minor', 'notable', 'keystone' ] as const;

	protected override afterConnected(): void {
		super.afterConnected();

		this.addEventListener('keydown', this.onKeydown);
	}

	protected override createWorker() {
		return createCanvasWorker<CanvasEditorWorkerMethods>(CanvasWorkerEditor);
	}

	//#region from canvas worker
	protected onWorkerDataUpdated(_data: CanvasEditorWorkerApiOut['dataUpdated']) {
		this.updated = true;
	}

	protected onWorkerStartNodeMove(data: CanvasEditorWorkerApiOut['startNodeMove']) {
		const rect = this.getBoundingClientRect();

		const mousemove = (() => {
			let moveEv: MouseEvent = undefined as any;
			const fn = () => {
				this.worker.moveNode({
					...data,
					mouseX: moveEv.offsetX,
					mouseY: moveEv.offsetY,
					rect,
				});
			};

			return (ev: MouseEvent) => { moveEv = ev; requestAnimationFrame(fn); };
		})();

		const mouseup = () => {
			removeEventListener('mousemove', mousemove);
			removeEventListener('mouseup', mouseup);

			this.viewMoving = false;
		};

		addEventListener('mousemove', mousemove);
		addEventListener('mouseup', mouseup);

		this.viewMoving = true;
		this.hoveredNode = undefined;
	}

	protected onWorkerStartHandleMove(data: CanvasEditorWorkerApiOut['startHandleMove']) {
		const rect = this.getBoundingClientRect();

		const mousemove = (() => {
			let moveEv: MouseEvent = undefined as any;
			const fn = () => {
				this.worker.moveHandle({
					...data,
					mouseX: moveEv.offsetX,
					mouseY: moveEv.offsetY,
					rect,
				});
			};

			return (ev: MouseEvent) => { moveEv = ev; requestAnimationFrame(fn); };
		})();
		const mouseup = () => {
			removeEventListener('mousemove', mousemove);
			removeEventListener('mouseup', mouseup);

			this.viewMoving = false;
		};
		addEventListener('mousemove', mousemove);
		addEventListener('mouseup', mouseup);

		this.viewMoving = true;
		this.hoveredNode = undefined;
	}

	protected onWorkerAssignDataToNode(_data: CanvasEditorWorkerApiOut['assignDataToNode']) {
		this.hoveredNode = undefined;
	}

	protected onWorkerDataSaved(_data: CanvasEditorWorkerApiOut['dataSaved']) {
		this.updated = false;
	}

	protected onWorkerDraw(_data: CanvasEditorWorkerApiOut['draw']) {
		this.requestUpdate();
	}
	//#endregion

	//#region to canvas worker
	protected override onMousedown(ev: MouseEvent) {
		if (ev.buttons !== 1)
			return;

		ev.preventDefault();
		this.focus();

		const event = makeObjectTransferable(ev);
		this.worker.mousedown({ event });
	}

	protected onKeydown(ev: KeyboardEvent) {
		const event = makeObjectTransferable(ev);
		this.worker.keydown({ event });
	};

	protected assignNodeData(nodeId: string, dataId: string | undefined) {
		this.worker.assignDataToNode({ nodeId, dataId });
	}

	protected async onClickSave() {
		this.worker.saveData({});
	}

	protected async onUploadSupabase() {
		this.worker.uploadToSupabase({});
	}
	//#endregion

	protected override renderTooltip(node: StorableGraphNode): unknown {
		const data = dataNodes.get(node.data ?? '');

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
					<li @click=${ () => this.assignNodeData(node.id, undefined) }>
						~ clear ~
					</li>
					${ map(dataNodes.values().filter(node => node.type === menu),
					data => html`
					<li @click=${ () => this.assignNodeData(node.id, data.id) }>
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
			<button @click=${ () => this.assignNodeData(node.id, undefined) }>
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
			when(this.updated || true, () => html`
			<s-state-panel>
				<button @click=${ this.onClickSave }>
					Save
				</button>

				<button @click=${ this.onUploadSupabase }>
					Upload to Supabase
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
