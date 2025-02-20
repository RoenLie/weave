import { html } from 'lit-html';
import { css, signal, type CSSStyle } from '../../app/custom-element/signal-element.ts';
import type { Vec2 } from '@roenlie/core/types';
import { GraphNode, type StorableGraphNode } from '../../app/graph/graph.ts';
import { type Viewport } from '../../app/canvas/is-outside-viewport.ts';
import { CustomElement } from '../../app/custom-element/custom-element.ts';
import CanvasWorkerReader from '../../app/canvas/canvas-worker-reader.ts?worker';
import { when } from 'lit-html/directives/when.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { GraphDataManager, FirebaseGraphRepository } from './utils/data-manager.ts';
import { createCanvasReaderWorker } from '../../app/canvas/canvas-worker-interface.ts';
import { makeObjectTransferable, type CanvasReaderWorkerApiOut } from '../../app/canvas/canvas-worker-base.ts';
import { allDataNodes, nodeDataCatalog } from '../../app/graph/node-catalog.ts';


const unsetPopover = css`
background: unset;
overflow: unset;
padding:  unset;
margin:   unset;
border:   unset;
height:   unset;
width:    unset;
inset:    unset;
color:    unset;
`;


export class PoeCanvasBase extends CustomElement {

	@signal protected accessor selectedNode: GraphNode | undefined;
	@signal protected accessor hoveredNode:  StorableGraphNode | undefined;

	protected position: Vec2 | undefined;
	protected viewport: Viewport | undefined;
	protected scale:    number | undefined;

	protected readonly imageSize: number = 13000;
	protected readonly worker = createCanvasReaderWorker(CanvasWorkerReader);
	protected readonly dataManager = new GraphDataManager(new FirebaseGraphRepository());
	protected readonly resizeObserver = new ResizeObserver(([ entry ]) => {
		if (!entry)
			return;

		this.worker.setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
	});

	protected override connectedCallback(): void {
		super.connectedCallback();
		this.tabIndex = 0;

		this.dataManager.load().then(async () => {
			this.requestUpdate();
			await this.updateComplete;

			this.afterDataLoaded();
		});
	}

	protected override disconnectedCallback(): void {
		super.disconnectedCallback();

		this.worker.removeEventListener('message', this.boundWorkerMessage);

		this.resizeObserver.unobserve(this);
	}

	protected override afterUpdate(changedProps: Set<string>): void {
		super.afterUpdate(changedProps);

		if (changedProps.has('hoveredNode')) {
			if (this.hoveredNode) {
				const tooltip = this.shadowRoot?.querySelector<HTMLElement>('article[popover="manual"]');
				if (tooltip)
					tooltip.showPopover();
			}
		}
	}

	protected afterDataLoaded() {
		const bgCanvas = this.shadowRoot!.querySelector<HTMLCanvasElement>('#background')!;
		const mainCanvas = this.shadowRoot!.querySelector<HTMLCanvasElement>('#main')!;

		this.worker.addEventListener('message', this.boundWorkerMessage);

		this.worker.transferChunks({
			nodeChunks:       this.dataManager.nodeChunks,
			connectionChunks: this.dataManager.connectionChunks,
		});

		this.worker.init(bgCanvas, mainCanvas);
		this.worker.setSize({ width: this.offsetWidth, height: this.offsetHeight });
		this.worker.setArea({ width: this.imageSize, height: this.imageSize });
		this.worker.initBackground({});

		this.resizeObserver.observe(this);
	}

	protected boundWorkerMessage = (ev: MessageEvent) => this.onWorkerMessage(ev);

	/**
	 * Called on message from the worker.\
	 * `ev.data.type` is the type of message.\
	 * Can be used decide if the message should be handled.
	 */
	protected onWorkerMessage(ev: MessageEvent) {
		this.onUpdatePosition(ev);
		this.onStartViewMove(ev);
		this.onOpenTooltip(ev);
		this.onCloseTooltip(ev);
	}

	protected onUpdatePosition = (ev: MessageEvent) => {
		if (ev.data.type !== 'updatePosition')
			return;

		this.position = ev.data.position;
		this.viewport = ev.data.viewport;
		this.scale    = ev.data.scale;

		this.requestUpdate();
	};

	protected onStartViewMove = (ev: MessageEvent) => {
		if (ev.data.type !== 'startViewMove')
			return;

		const viewOffsetX = ev.data.offsetX;
		const viewOffsetY = ev.data.offsetY;

		const rect = this.getBoundingClientRect();
		const deltaY = rect.top;
		const deltaX = rect.left;

		// We setup the mousemove and mouseup events
		// For panning the view
		const mousemove = (moveEv: MouseEvent) => {
			const x = moveEv.offsetX - deltaX - viewOffsetX;
			const y = moveEv.offsetY - deltaY - viewOffsetY;

			this.worker.moveTo({ x, y });
		};
		const mouseup = () => {
			removeEventListener('mousemove', mousemove);
			removeEventListener('mouseup', mouseup);
		};

		addEventListener('mousemove', mousemove);
		addEventListener('mouseup', mouseup);
	};

	protected onCloseTooltip = (ev: MessageEvent<CanvasReaderWorkerApiOut['closeTooltip']>) => {
		if (ev.data.type !== 'closeTooltip')
			return;

		this.hoveredNode = undefined;
	};

	protected onOpenTooltip = (ev: MessageEvent<CanvasReaderWorkerApiOut['openTooltip']>) => {
		if (ev.data.type !== 'openTooltip')
			return;

		//this.hoveredNode = this.dataManager.nodes.get(ev.data.nodeId);
		this.hoveredNode = ev.data.node;
	};

	protected onMousemove(ev: MouseEvent) {
		const transferableEv = makeObjectTransferable(ev);

		this.worker.mousemove({
			event: transferableEv,
		});
	}

	protected onMousewheel(ev: WheelEvent) {
		ev.preventDefault();

		const vec = { x: ev.offsetX, y: ev.offsetY };

		if (-ev.deltaY > 0)
			this.worker.scaleAt({ vec, factor: 1.1 });
		else
			this.worker.scaleAt({ vec, factor: 1 / 1.1 });
	}

	protected onMousedown(downEv: MouseEvent) {
		if (downEv.buttons !== 1) // We only care about left clicks
			return;

		downEv.preventDefault();
		this.focus();

		const transferableEv = makeObjectTransferable(downEv);

		this.worker.mousedown({
			event: transferableEv,
		});
	}

	protected beforeCloseTooltip(_node: GraphNode) {}
	protected beforeOpenTooltip(_node: GraphNode) {}

	protected renderTooltip(node: StorableGraphNode): unknown {
		if (!node.data)
			return 'MISSING DATA';

		const data = allDataNodes.get(node.data)!;

		return html`
		<div style="white-space:nowrap;">
			${ data.id }
		</div>
		<div>
			${ data.description }
		</div>
		`;
	}

	protected override render(): unknown {
		if (!this.dataManager.ready)
			return html`<div>Loading...</div>`;

		return html`
		<canvas id="background"></canvas>
		<canvas id="main"
			@mousemove=${ this.onMousemove }
			@mousedown =${ this.onMousedown }
			@mousewheel=${ this.onMousewheel }
		></canvas>

		${ when(this.hoveredNode, () => {
			if (!this.viewport || !this.position || !this.scale)
				return;

			const node = this.hoveredNode!;
			const rect = this.getBoundingClientRect();
			const scale = this.scale;
			const x = (node.x * scale) + (this.position.x + rect.left) + (node.radius * scale);
			const y = (node.y * scale) + (this.position.y + rect.top)  - (node.radius * scale);

			console.log('show it :8');


			return html`
			<article
				style=${ styleMap({ top: y + 'px', left: x + 'px' }) }
				class="tooltip"
				popover="manual"
			>
				<s-tooltip>
					${ this.renderTooltip(node) }
				</s-tooltip>
			</article>
			`;
		}) }
		`;
	}

	public static override styles: CSSStyle = css`
		:host {
			contain: strict;
			display: grid;
			outline: none;
			background-color: rgb(8, 12, 18);
		}
		canvas {
			grid-row: 1/2;
			grid-column: 1/2;
		}
		canvas#background {}
		canvas#main {}
		article.tooltip:popover-open {
			${ unsetPopover }
			position: absolute;
			display: grid;
			place-items: center start;
		}
		s-tooltip {
			position: absolute;
			display: block;
			width: max-content;
		}
	`;

}
