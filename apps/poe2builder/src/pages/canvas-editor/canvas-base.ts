import { html } from 'lit-html';
import type { Vec2 } from '@roenlie/core/types';
import { GraphNode, type StorableGraphNode } from '../../app/graph/graph-node.ts';
import { type Viewport } from '../../app/canvas/is-outside-viewport.ts';
import CanvasWorkerReader from '../../app/canvas/workers/canvas-reader.ts?worker';
import { when } from 'lit-html/directives/when.js';
import { createCanvasWorker, makeObjectTransferable, type CanvasReaderWorkerMethods, type TransferableMouseEvent, type TransferableWheelEvent } from '../../app/canvas/workers/canvas-worker-interface.ts';
import { dataNodes } from '../../app/graph/node-catalog.ts';
import { uppercaseFirstLetter } from '@roenlie/core/string';
import { ref, type RefOrCallback } from 'lit-html/directives/ref.js';
import type { CanvasReaderWorkerApiOut } from '../../app/canvas/workers/reader-implementation.ts';
import { supabase } from '../../app/supabase.ts';
import { css, CustomElement, state, type CSSStyle } from '@roenlie/custom-element';


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

	public static fps = 100;

	@state() protected accessor selectedNode: GraphNode | undefined;
	@state() protected accessor hoveredNode: StorableGraphNode | undefined;
	@state() protected accessor viewMoving: boolean = false;

	protected position: Vec2 | undefined;
	protected viewport: Viewport | undefined;
	protected scale:    number | undefined;
	protected worker:   Worker & CanvasReaderWorkerMethods;

	protected readonly imageSize: number = 13000;
	protected readonly resizeObserver = new ResizeObserver(([ entry ]) => {
		if (!entry)
			return;

		const { width, height } = entry.contentRect;
		this.worker.setSize({ width, height });
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

	protected async initializeWorker() {
		this.worker = this.createWorker();

		await this.worker.ready();

		const { data: { session }, error } = await supabase.auth.getSession();
		if (!session)
			return console.error(error);

		const mainCanvas = this.shadowRoot!.querySelector<HTMLCanvasElement>('#main')!;

		this.worker.addEventListener('message', this.boundWorkerMessage);
		this.worker.init({ main: mainCanvas.transferControlToOffscreen(), session });
		this.worker.setSize({ width: this.offsetWidth, height: this.offsetHeight });
		this.worker.setArea({ width: this.imageSize, height: this.imageSize });
		this.worker.initBackground({});
	}

	protected boundWorkerMessage = (ev: MessageEvent) => this.onWorkerMessage(ev.data);

	//#region from canvas worker
	protected onWorkerMessage(data: CanvasReaderWorkerApiOut[keyof CanvasReaderWorkerApiOut]) {
		const fn = (this as any)['onWorker' + uppercaseFirstLetter(data.type)];
		if (typeof fn === 'function')
			fn.call(this, data);
		else
			console.warn(`Unknown worker message type: ${ data.type }`);
	}

	protected onWorkerStartViewMove(data: CanvasReaderWorkerApiOut['startViewMove']) {
		const rect = this.getBoundingClientRect();

		// We setup the mousemove and mouseup events for panning the view
		const mousemove = (() => {
			let ev: MouseEvent = undefined as any;
			let lastFrameTime: number = performance.now();

			const fn = (currentTime: number) => {
				const deltaTime = currentTime - lastFrameTime;
				if (deltaTime < 1000 / PoeCanvasBase.fps)
					return;

				lastFrameTime = currentTime;
				const x = ev.offsetX - rect.x - data.offsetX;
				const y = ev.offsetY - rect.y - data.offsetY;

				this.worker.moveTo({ x, y });
			};

			return (event: MouseEvent) => {
				ev = event; requestAnimationFrame(fn);
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

	protected onWorkerStartViewTouchMove(data: CanvasReaderWorkerApiOut['startViewTouchMove']) {
		const rect = this.getBoundingClientRect();

		const getDistance = (touch1: Touch, touch2: Touch) => {
			const dx = touch2.clientX - touch1.clientX;
			const dy = touch2.clientY - touch1.clientY;

			return Math.sqrt(dx * dx + dy * dy);
		};

		let initialDistance: number | undefined;

		// We setup the mousemove and mouseup events for panning the view
		const touchmove = (() => {
			let ev: TouchEvent = undefined as any;
			let lastFrameTime: number = performance.now();

			const fn = (currentTime: number) => {
				const deltaTime = currentTime - lastFrameTime;
				if (deltaTime < 1000 / PoeCanvasBase.fps)
					return;

				lastFrameTime = currentTime;

				const touch1 = ev.touches[0];
				if (!touch1)
					return touchend(ev);

				// For touch we also need to find out if we are zooming or moving
				if (ev.touches.length === 2) {
					const touch2 = ev.touches[1]!;

					if (initialDistance === undefined)
						initialDistance = getDistance(touch1, touch2);

					const currentDistance = getDistance(touch1, touch2);
					const factor = currentDistance / initialDistance;

					initialDistance = currentDistance;

					const touch1OffsetX = touch1.pageX - rect.x;
					const touch1OffsetY = touch1.pageY - rect.y;
					const touch2OffsetX = touch2.pageX - rect.x;
					const touch2OffsetY = touch2.pageY - rect.y;

					const x = (touch1OffsetX + touch2OffsetX) / 2;
					const y = (touch1OffsetY + touch2OffsetY) / 2;

					this.worker.scaleAt({ vec: { x, y }, factor });
				}
				else {
					const x = touch1.clientX - rect.x - data.offsetX;
					const y = touch1.clientY - rect.y - data.offsetY;

					this.worker.moveTo({ x, y });
				}
			};

			return (event: TouchEvent) => {
				ev = event; requestAnimationFrame(fn);
			};
		})();
		const touchend = (_event: TouchEvent) => {
			removeEventListener('touchmove', touchmove);
			removeEventListener('touchstart', touchend);
			removeEventListener('touchend', touchend);

			this.viewMoving = false;
		};

		addEventListener('touchmove', touchmove);
		addEventListener('touchstart', touchend);
		addEventListener('touchend', touchend);

		this.viewMoving = true;
	}

	protected onWorkerEnterNode(data: CanvasReaderWorkerApiOut['enterNode']) {
		this.hoveredNode = data.node;
		this.position = data.position;
		this.viewport = data.viewport;
		this.scale    = data.scale;
	}

	protected onWorkerLeaveNode(data: CanvasReaderWorkerApiOut['leaveNode']) {
		this.hoveredNode = undefined;
		this.position = data.position;
		this.viewport = data.viewport;
		this.scale    = data.scale;
	}
	//#endregion

	//#region to canvas worker
	protected onMousedown(downEv: MouseEvent) {
		if (downEv.buttons !== 1)
			return;

		downEv.preventDefault();
		this.focus();

		const event = makeObjectTransferable(downEv);
		this.worker.mousedown({ event });
	}

	protected onMousemove = (() => {
		let lastFrameTime: number = performance.now();
		let event: TransferableMouseEvent = undefined as any;
		const fn = (currentTime: number) => {
			const deltaTime = currentTime - lastFrameTime;
			if (deltaTime < 1000 / PoeCanvasBase.fps)
				return;

			lastFrameTime = currentTime;
			this.worker.mousemove({ event });
		};

		return (ev: MouseEvent) => {
			event = makeObjectTransferable(ev);
			requestAnimationFrame(fn);
		};
	})();

	protected onMousewheel = (() => {
		let lastFrameTime: number = performance.now();
		let event: TransferableWheelEvent = undefined as any;

		const fn = (currentTime: number) => {
			const deltaTime = currentTime - lastFrameTime;
			if (deltaTime < 1000 / PoeCanvasBase.fps)
				return;

			lastFrameTime = currentTime;
			const vec = { x: event.offsetX, y: event.offsetY };
			const deltaY = event.deltaY;
			const factor = -deltaY > 0 ? 1.1 : 1 / 1.1;
			this.worker.scaleAt({ vec, factor });
		};

		return (ev: WheelEvent) => {
			this.hoveredNode = undefined;
			event = makeObjectTransferable(ev);
			requestAnimationFrame(fn);
		};
	})();

	protected onTouchstart(downEv: TouchEvent) {
		downEv.preventDefault();
		this.focus();

		const event = makeObjectTransferable(downEv);
		const touches = [ ...downEv.touches ].map(touch => makeObjectTransferable(touch));
		const rect = this.getBoundingClientRect();

		this.worker.touchstart({ event, touches, rect });
	}
	//#endregion

	protected renderTooltip(node: StorableGraphNode): unknown {
		if (!node.data)
			return 'MISSING DATA';

		const data = dataNodes.get(node.data)!;

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

		const node = GraphNode.fromStorable(this.hoveredNode!);
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
		<canvas id="main"
			@mousemove=${ this.onMousemove }
			@mousedown =${ this.onMousedown }
			@mousewheel=${ this.onMousewheel }
			@touchstart=${ this.onTouchstart }
		></canvas>

		<!--<s-debug>
		</s-debug>-->

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
		/*s-debug {
			position: fixed;
			right: 0;
			bottom: 0;
			display: grid;
			background-color: white;
			color: black;
			width: 30vw;
			height: 5vh;
			font-size: 16px;
		}*/
		canvas {
			grid-row: 1/2;
			grid-column: 1/2;
		}
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
