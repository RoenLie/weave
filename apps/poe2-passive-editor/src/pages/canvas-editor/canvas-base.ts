import { html } from 'lit-html';
import { css, signal, type CSSStyle } from '../../app/custom-element/signal-element.ts';
import type { Vec2 } from '@roenlie/core/types';
import { GraphNode, type StorableGraphNode } from '../../app/graph/graph.ts';
import { type Viewport } from '../../app/canvas/is-outside-viewport.ts';
import { CustomElement } from '../../app/custom-element/custom-element.ts';
import CanvasWorkerReader from '../../app/canvas/workers/canvas-reader.ts?worker';
import { when } from 'lit-html/directives/when.js';
import { createCanvasWorker, makeObjectTransferable, type CanvasReaderWorkerMethods } from '../../app/canvas/workers/canvas-worker-interface.ts';
import { allDataNodes } from '../../app/graph/node-catalog.ts';
import { uppercaseFirstLetter } from '@roenlie/core/string';
import { ref, type RefOrCallback } from 'lit-html/directives/ref.js';
import type { CanvasReaderWorkerApiOut } from '../../app/canvas/workers/reader-implementation.ts';


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
	@signal protected accessor hoveredNode: StorableGraphNode | undefined;
	@signal protected accessor viewMoving: boolean = false;

	protected position: Vec2 | undefined;
	protected viewport: Viewport | undefined;
	protected scale:    number | undefined;
	protected worker:   Worker & CanvasReaderWorkerMethods;

	protected readonly imageSize: number = 13000;
	protected readonly resizeObserver = new ResizeObserver(([ entry ]) => {
		if (!entry)
			return;

		this.worker.setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
	});

	protected override connectedCallback(): void {
		super.connectedCallback();

		this.tabIndex = 0;
		this.resizeObserver.observe(this);
	}

	protected override disconnectedCallback(): void {
		super.disconnectedCallback();

		this.worker.removeEventListener('message', this.boundWorkerMessage);
		this.worker.terminate();
		this.resizeObserver.unobserve(this);
	}

	protected override afterConnected() {
		this.initializeWorker();
	}

	protected createWorker() {
		return createCanvasWorker<CanvasReaderWorkerMethods>(CanvasWorkerReader);
	}

	protected initializeWorker() {
		this.worker = this.createWorker();

		const bgCanvas = this.shadowRoot!.querySelector<HTMLCanvasElement>('#background')!;
		const mainCanvas = this.shadowRoot!.querySelector<HTMLCanvasElement>('#main')!;

		this.worker.addEventListener('message', this.boundWorkerMessage);

		this.worker.init(bgCanvas, mainCanvas);
		this.worker.setSize({ width: this.offsetWidth, height: this.offsetHeight });
		this.worker.setArea({ width: this.imageSize, height: this.imageSize });
		this.worker.initBackground({});
	}

	protected boundWorkerMessage = (ev: MessageEvent) => this.onWorkerMessage(ev);

	//#region from canvas worker
	protected onWorkerMessage(ev: MessageEvent<CanvasReaderWorkerApiOut[keyof CanvasReaderWorkerApiOut]>) {
		const fn = (this as any)['onWorker' + uppercaseFirstLetter(ev.data.type)];
		if (typeof fn === 'function')
			fn.call(this, ev);
		else
			console.warn(`Unknown worker message type: ${ ev.data.type }`);
	}

	protected onWorkerUpdatePosition(ev: MessageEvent<CanvasReaderWorkerApiOut['updatePosition']>) {
		this.position = ev.data.position;
		this.viewport = ev.data.viewport;
		this.scale    = ev.data.scale;

		this.requestUpdate();
	};

	protected onWorkerStartViewMove(ev: MessageEvent<CanvasReaderWorkerApiOut['startViewMove']>) {
		const viewOffsetX = ev.data.offsetX;
		const viewOffsetY = ev.data.offsetY;

		const rect = this.getBoundingClientRect();
		const deltaY = rect.top;
		const deltaX = rect.left;

		// We setup the mousemove and mouseup events for panning the view
		const mousemove = (() => {
			let moveEv: MouseEvent = undefined as any;
			const fn = () => {
				const x = moveEv.offsetX - deltaX - viewOffsetX;
				const y = moveEv.offsetY - deltaY - viewOffsetY;

				this.worker.moveTo({ x, y });
			};

			return (ev: MouseEvent) => {
				moveEv = ev; requestAnimationFrame(fn);
			};
		})();
		const mouseup = () => {
			removeEventListener('mousemove', mousemove);
			removeEventListener('mouseup', mouseup);

			this.viewMoving = false;
		};
		addEventListener('mousemove', mousemove);
		addEventListener('mouseup', mouseup);

		this.viewMoving = true;
	};

	protected onWorkerEnterNode(ev: MessageEvent<CanvasReaderWorkerApiOut['enterNode']>) {
		this.hoveredNode = ev.data.node;
	}

	protected onWorkerLeaveNode(_ev: MessageEvent<CanvasReaderWorkerApiOut['leaveNode']>) {
		this.hoveredNode = undefined;
	}
	//#endregion

	//#region to canvas worker
	protected onMousemove(ev: MouseEvent) {
		const event = makeObjectTransferable(ev);
		requestAnimationFrame(() => this.worker.mousemove({ event }));
	}

	protected onMousewheel(ev: WheelEvent) {
		ev.preventDefault();

		const vec = { x: ev.offsetX, y: ev.offsetY };
		const deltaY = ev.deltaY;
		requestAnimationFrame(() => {
			if (-deltaY > 0)
				this.worker.scaleAt({ vec, factor: 1.1 });
			else
				this.worker.scaleAt({ vec, factor: 1 / 1.1 });
		});
	}

	protected onMousedown(downEv: MouseEvent) {
		if (downEv.buttons !== 1) // We only care about left clicks
			return;

		downEv.preventDefault();
		this.focus();

		const event = makeObjectTransferable(downEv);
		this.worker.mousedown({ event });
	}
	//#endregion

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

	protected onRefCallback: RefOrCallback = async (el) => {
		if (!(el instanceof HTMLElement))
			return;

		await this.updateComplete;
		if (!el.isConnected)
			return;

		if (!this.viewport || !this.position || !this.scale)
			return;

		const node = this.hoveredNode!;
		const rect = this.getBoundingClientRect();
		const scale = this.scale;
		const x = (node.x * scale) + (this.position.x + rect.left) + (node.radius * scale);
		const y = (node.y * scale) + (this.position.y + rect.top)  - (node.radius * scale);

		el.style.top = y + 'px';
		el.style.left = x + 'px';

		el.showPopover();
	};

	protected override render(): unknown {
		return html`
		<canvas id="background"></canvas>
		<canvas id="main"
			@mousemove=${ this.onMousemove }
			@mousedown =${ this.onMousedown }
			@mousewheel=${ this.onMousewheel }
		></canvas>

		${ when(!this.viewMoving && this.hoveredNode, node => {
			return html`
			<article
				${ ref(this.onRefCallback) }
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
