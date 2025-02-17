import { html } from 'lit-html';
import { css, signal, type CSSStyle } from '../../app/custom-element/signal-element.ts';
import type { Vec2 } from '@roenlie/core/types';
import { GraphNode } from '../../app/graph/graph.ts';
import { type Viewport } from '../../app/canvas/is-outside-viewport.ts';
import { CustomElement } from '../../app/custom-element/custom-element.ts';
import { WorkerView } from '../../app/canvas/canvas-view.ts';
import { when } from 'lit-html/directives/when.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { GraphDataManager, FirebaseGraphRepository } from './data-manager.ts';


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


export class PoeCanvasPassiveBase extends CustomElement {

	@signal protected accessor selectedNode: GraphNode | undefined;
	@signal protected accessor hoveredNode:  GraphNode | undefined;

	protected position: Vec2 | undefined;
	protected viewport: Viewport | undefined;
	protected scale:    number | undefined;

	protected readonly imageSize:  number = 13000;
	protected readonly workerView: WorkerView = new WorkerView();
	protected readonly dataManager = new GraphDataManager(new FirebaseGraphRepository());
	protected readonly resizeObserver = new ResizeObserver(([ entry ]) => {
		if (!entry)
			return;

		this.workerView.setSize(entry.contentRect.width, entry.contentRect.height);
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

		this.workerView.worker.removeEventListener('message', this.onStartViewMove);
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

		this.workerView.worker.addEventListener('message', this.onUpdatePosition);
		this.workerView.worker.addEventListener('message', this.onStartViewMove);
		this.workerView.worker.addEventListener('message', this.onOpenTooltip);
		this.workerView.worker.addEventListener('message', this.onCloseTooltip);

		this.workerView.transferNodes(this.dataManager.nodes);
		this.workerView.transferConnections(this.dataManager.connections);

		this.workerView.init(bgCanvas, mainCanvas);
		this.workerView.setSize(this.offsetWidth, this.offsetHeight);
		this.workerView.setArea(this.imageSize, this.imageSize);
		this.workerView.initBackground();

		this.resizeObserver.observe(this);
	}

	protected onUpdatePosition = (ev: MessageEvent) => {
		if (ev.data.type !== 'update-position')
			return;

		this.position = ev.data.position;
		this.viewport = ev.data.viewport;
		this.scale    = ev.data.scale;

		this.requestUpdate();
	};

	protected onStartViewMove = (ev: MessageEvent) => {
		if (ev.data.type !== 'start-view-move')
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

			this.workerView.moveTo(x, y);
		};
		const mouseup = () => {
			removeEventListener('mousemove', mousemove);
			removeEventListener('mouseup', mouseup);
		};

		addEventListener('mousemove', mousemove);
		addEventListener('mouseup', mouseup);
	};

	protected onCloseTooltip = (ev: MessageEvent) => {
		if (ev.data.type !== 'close-tooltip')
			return;

		this.hoveredNode = undefined;
	};

	protected onOpenTooltip = (ev: MessageEvent) => {
		if (ev.data.type !== 'open-tooltip')
			return;

		this.hoveredNode = this.dataManager.nodes.get(ev.data.nodeId);
	};

	protected onMousemove(ev: MouseEvent) {
		this.workerView.mousemove({
			type:     'mousemove',
			offsetX:  ev.offsetX,
			offsetY:  ev.offsetY,
			altKey:   ev.altKey,
			metaKey:  ev.metaKey,
			ctrlKey:  ev.ctrlKey,
			shiftKey: ev.shiftKey,
		});
	}

	protected onMousewheel(ev: WheelEvent) {
		ev.preventDefault();

		const vec = { x: ev.offsetX, y: ev.offsetY };

		if (-ev.deltaY > 0)
			this.workerView.scaleAt(vec, 1.1);
		else
			this.workerView.scaleAt(vec, 1 / 1.1);
	}

	protected onMousedown(downEv: MouseEvent) {
		if (downEv.buttons !== 1) // We only care about left clicks
			return;

		downEv.preventDefault();
		this.focus();

		this.workerView.mousedown({
			type:     'mousedown',
			buttons:  downEv.buttons,
			offsetX:  downEv.offsetX,
			offsetY:  downEv.offsetY,
			altKey:   downEv.altKey,
			metaKey:  downEv.metaKey,
			ctrlKey:  downEv.ctrlKey,
			shiftKey: downEv.shiftKey,
		});
	}

	protected beforeCloseTooltip(_node: GraphNode) {}
	protected beforeOpenTooltip(_node: GraphNode) {}

	protected renderTooltip(node: GraphNode): unknown {
		if (!node.data)
			return 'MISSING DATA';

		return html`
		<div style="white-space:nowrap;">
			${ node.data.id }
		</div>
		<div>
			${ node.data.description }
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


class ForEach extends HTMLElement {

	static { queueMicrotask(() => customElements.define('for-each', ForEach)); }

	public items: unknown[] = [];

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (name === 'items') {
			this.items = JSON.parse(newValue);
			this.render();
		}
	}

	connectedCallback() {
		this.style.display = 'contents';
		const template = this.querySelector('template')!;
		console.log(template);
	}

	protected render() {
		const template = this.querySelector('template')!;
		console.log(template);
	}

}
