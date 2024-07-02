import { autoUpdate, computePosition, flip, offset, type Placement, shift } from '@floating-ui/dom';
import { queryId, watch } from '@roenlie/lit-utilities/decorators';
import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html } from 'lit';
import { queryAssignedElements, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import { MMButton } from '../button/button.cmp.js';
import { MMIcon } from '../icon/icon-element.js';
import { MMVirtualScrollbar } from '../virtual-scrollbar/virtual-scrollbar.cmp.js';

MMVirtualScrollbar.register();
MMButton.register();
MMIcon.register();


interface SlotActionElement extends HTMLElement {
	previousSlot?: string;
}


@customElement('mm-action-bar')
export class MMActionBar extends MimicElement {

	@state() protected overflowOpen = false;
	protected autoUpdateCleanup?: () => void;
	@queryId('wrapper') protected wrapperEl?: HTMLElement;

	@queryAssignedElements({ flatten: true })
	protected slotContent: SlotActionElement[];

	@queryAssignedElements({ slot: 'overflow', flatten: true })
	protected overflowSlot: SlotActionElement[];

	protected resizeObs = new ResizeObserver(([ entry ]) => {
		const hostRect = entry?.contentRect;
		if (!hostRect)
			return;

		this.updateSlotNames();
	});

	public override connectedCallback() {
		super.connectedCallback();
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();
		this.autoUpdateCleanup?.();
	}

	public override afterConnectedCallback() {
		this.updateSlotNames();
		this.resizeObs.observe(this);
	}

	protected updateSlotNames() {
		const hostRect = this.getBoundingClientRect();
		if (!this.wrapperEl || !hostRect)
			return;

		let wrapperRect: DOMRect;
		do {
			wrapperRect = this.wrapperEl.getBoundingClientRect();
			const els = this.slotContent;

			if (wrapperRect.width < hostRect.width) {
				const firstOverflowEl = this.overflowSlot.at(0);
				if (firstOverflowEl)
					firstOverflowEl.slot = firstOverflowEl.previousSlot ?? '';
			}

			if (wrapperRect.width > hostRect.width) {
				const el = els.at(-1)!;
				el.previousSlot = el.slot;
				el.slot = 'overflow';
			}

			wrapperRect = this.wrapperEl.getBoundingClientRect();
		} while (wrapperRect.width > hostRect.width);

		this.updateComplete.then(() => void this.requestUpdate());
	}

	@watch('overflowOpen') protected onOverflowOpen() {
		if (!this.overflowOpen)
			return;

		const referenceEl = this.renderRoot.querySelector<HTMLElement>('mm-button');
		const floatingEl = this.renderRoot.querySelector<HTMLElement>('s-popout');
		if (!referenceEl || !floatingEl)
			return;

		const placement = 'bottom-end' as Placement;

		this.autoUpdateCleanup?.();
		this.autoUpdateCleanup = autoUpdate(referenceEl, floatingEl, () => {
			computePosition(referenceEl, floatingEl, {
				strategy:   'fixed',
				placement:  placement,
				middleware: [
					offset({ mainAxis: 0, crossAxis: 0 }),
					flip(),
					shift(),
				],
			}).then(({ x, y }) => {
				Object.entries({
					position: 'fixed',
					left:     `${ x }px`,
					top:      `${ y }px`,
				}).forEach(([ prop, val ]) => floatingEl.style.setProperty(prop, val));
				floatingEl.setAttribute('data-placement', placement);
			});
		});


		setTimeout(() => {
			const clickEvent = (ev: MouseEvent) => {
				const path = ev.composedPath();
				if (path.some(el => el === floatingEl || el === referenceEl))
					return;

				this.overflowOpen = false;
				globalThis.removeEventListener('click', clickEvent);
			};

			globalThis.addEventListener('click', clickEvent);
		});
	}

	protected override render(): unknown {
		return html`
		<s-wrapper id="wrapper">
			<slot></slot>

			${ when(this.overflowSlot.length, () => html`
			<mm-button
				type="icon"
				size="small"
				variant="elevated"
				@click=${ () => this.overflowOpen = !this.overflowOpen }
			>
				<mm-icon
					style="font-size:18px;"
					url="https://icons.getbootstrap.com/assets/icons/three-dots.svg"
				></mm-icon>
			</mm-button>
			`) }
		</s-wrapper>

		<s-popout part="popout" style=${ styleMap({
			display: this.overflowOpen ? '' : 'none',
		}) }>
			<slot name="overflow" style="display: none;"></slot>

			${ map(this.overflowSlot, el => {
				return html`
				<mm-ripple>
					<s-popout-item
						@click=${ () => el.click() }
					>
						${ el.innerText }
					</s-popout-item>
				</mm-ripple>
				`;
			}) }

			<mm-virtual-scrollbar
				placement="end"
				direction="vertical"
				.reference=${ this.updateComplete
					.then(() => this.renderRoot.querySelector<HTMLElement>('s-popout')!) }
			></mm-virtual-scrollbar>
		</s-popout>
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			--_actionbar-item-height: var(--actionbar-item-height, 50px);
			--_actionbar-popout-bg: var(--actionbar-popout-bg, rgb(var(--mm-palette-neutral-variant30)));
			--_actionbar-popout-border: var(--actionbar-popout-bg, 1px solid rgb(80 80 80));

			overflow: hidden;
			display: grid;
			grid-auto-columns: max-content;
			grid-auto-flow: column;
			place-content: center end;
			padding-inline: 4px;
		}
		s-wrapper {
			display: grid;
			grid-auto-flow: column;
			grid-auto-columns: max-content;
			place-items: center;
			gap: 8px;
		}
		s-popout {
			position: fixed;
			overflow: hidden;
			overflow-y: scroll;
			display: grid;
			grid-auto-flow: row;
			grid-auto-rows: max-content;
			width: max-content;
			z-index: 1;
			min-width: 150px;
			max-height: calc(var(--_actionbar-item-height) * 5);
			border-radius: 8px;
			border: var(--_actionbar-popout-border);
			background-color: var(--_actionbar-popout-bg);
			scroll-snap-type: y mandatory;
			overscroll-behavior-y: contain;
			overscroll-behavior-x: auto;
		}
		s-popout::-webkit-scrollbar {
			display: none;
		}
		s-popout-item {
			position: relative;
			display: grid;
			place-items: center;
			padding-block: 6px;
			padding-inline: 12px;
			height: var(--_actionbar-item-height);
			scroll-snap-align: start;
		}
		s-popout-item::before {
			content: '';
			pointer-events: none;
			position: absolute;
			inset: 0px;
			border-top: var(--_actionbar-popout-border);
			border-bottom: var(--_actionbar-popout-border);
		}
		s-popout-item:hover {
			background-color: teal;
		}
		`,
	];

}
