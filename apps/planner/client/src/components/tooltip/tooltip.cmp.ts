import { arrow, autoUpdate, computePosition, flip, offset, type Placement, shift } from '@floating-ui/dom';
import { animateTo, getAnimation, parseDuration, setDefaultAnimation, stopAnimations } from '@roenlie/core/animation';
import { createPromiseResolver } from '@roenlie/core/async';
import { emitEvent, hasKeyboardFocus, waitForEvent } from '@roenlie/core/dom';
import { EventController } from '@roenlie/lit-utilities/controllers';
import { watch } from '@roenlie/lit-utilities/decorators';
import { html, LitElement, TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { tooltipStyles } from './tooltip.styles.js';


export type TooltipProperties = {
	distance: number;
	skidding: number;
	disabled: boolean;
	trigger: string;
	hoist: boolean;
	arrow: boolean;
	placement: Placement;
}


@customElement('pl-tooltip')
export class TooltipCmp extends LitElement {

	//#region properties
	/**
	 * Controls how the tooltip is activated. Possible options include `click`, `hover`, `focus`, and `manual`.
	 * Multiple options can be passed by separating them with a space.
	 * When manual is used, the tooltip must be activated programmatically.
	 */
	@property({ type: String })  public trigger = 'hover focus';

	/**
	 * The preferred placement of the tooltip.
	 * Note that the actual placement may vary as needed to keep the tooltip inside of the viewport.
	 */
	@property({ type: String })  public placement: TooltipProperties['placement'] = 'top';

	/** The distance in pixels from which to offset the tooltip away from its target. */
	@property({ type: Number })  public distance = 10;

	/** The distance in pixels from which to offset the tooltip along its target. */
	@property({ type: Number })  public skidding = 0;

	/** The target element that is attached to the various event listeners */
	@property({ type: Object })  public target: HTMLElement;

	/** The tooltip's content. */
	@property({ type: Object })  public content: string | TemplateResult = '';

	/** Enables or disables the arrow pointing element */
	@property({ type: Boolean }) public displayArrow = true;

	/** Blocks closing events from occuring. Should only be used programmatically for special use cases. */
	@property({ type: Boolean }) public blockClosing = false;

	/** Blocks open events from occuring. Should only be used programmatically for special use cases. */
	@property({ type: Boolean }) public blockOpening = false;

	/** Stops the tooltip from being clipped by a parent container with `overflow: auto|hidden|scroll`. */
	@property({ type: Boolean }) public hoist = true;

	/** Indicates whether or not the tooltip is open. You can use this in lieu of the show/hide methods. */
	@property({ type: Boolean, reflect: true }) public open = false;

	/** Disables the tooltip so it won't show when triggered. */
	@property({ type: Boolean, reflect: true }) public disabled = false;

	@query('.tooltip') private tooltipQry: HTMLElement;
	@query('.tooltip__arrow') private arrowQry: HTMLElement;
	@query('.tooltip-positioner') private positionerQry: HTMLElement;
	private hoverTimeout: number;
	private positionerCleanup: ReturnType<typeof autoUpdate> | undefined;
	private eventCtrl = new EventController({ host: this });
	public transitioning = Promise.resolve();
	//#endregion


	//#region lifecycle
	public override async connectedCallback() {
		super.connectedCallback();

		await this.updateComplete;

		this.eventCtrl.addEventListener(this.target, 'blur', this.handleBlur, { capture: true });
		this.eventCtrl.addEventListener(this.target, 'focus', this.handleFocus, { capture: true });
		this.eventCtrl.addEventListener(this.target, 'click', this.handleClick);
		this.eventCtrl.addEventListener(this.target, 'keydown', this.handleKeyDown);
		this.eventCtrl.addEventListener(this.target, 'mouseenter', this.handleMouseEnter);
		this.eventCtrl.addEventListener(this.target, 'mouseout', this.handleMouseOut);

		this.positionerQry?.style.setProperty('position', this.hoist ? 'fixed' : 'absolute');

		this.tooltipQry.hidden = !this.open;
		this.positionerQry.hidden = !this.open;

		// If the tooltip is visible on init, update its position
		if (this.open)
			this.startPositioner();
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();
		this.stopPositioner();
	}
	//#endregion


	//#region logic
	/** Shows the tooltip. */
	public async show() {
		if (this.open)
			return undefined;

		this.open = true;

		await waitForEvent(this, 'after-show');
	}

	/** Hides the tooltip */
	public async hide() {
		if (!this.open)
			return undefined;

		this.open = false;

		await waitForEvent(this, 'after-hide');
	}

	public handleFocus = () => {
		const keyboardFocus = hasKeyboardFocus(this.target);

		if (!this.hasTrigger('focus') && !keyboardFocus)
			return;

		const delay = parseDuration(getComputedStyle(this).getPropertyValue('--show-delay'));
		clearTimeout(this.hoverTimeout);

		this.hoverTimeout = window.setTimeout(() => this.show(), delay);
	};

	public handleMouseEnter = () => {
		if (!this.hasTrigger('hover'))
			return;

		const delay = parseDuration(getComputedStyle(this).getPropertyValue('--show-delay'));
		clearTimeout(this.hoverTimeout);

		this.hoverTimeout = window.setTimeout(() => this.show(), delay);
	};

	public handleBlur = () => {
		if (this.blockClosing || !this.hasTrigger('focus'))
			return;

		const delay = parseDuration(getComputedStyle(this).getPropertyValue('--hide-delay'));
		clearTimeout(this.hoverTimeout);

		this.hoverTimeout = window.setTimeout(() => { this.hide(); }, delay);
	};

	public handleMouseOut = () => {
		if (this.blockClosing || !this.hasTrigger('hover'))
			return;

		const delay = parseDuration(getComputedStyle(this).getPropertyValue('--hide-delay'));
		clearTimeout(this.hoverTimeout);

		this.hoverTimeout = window.setTimeout(() => { this.hide(); }, delay);
	};

	private handleClick = () => {
		clearTimeout(this.hoverTimeout);
		this.blockOpening = true;

		if (this.hasTrigger('click')) {
			if (this.open && !this.blockClosing)
				this.hide();
		}
		else if (this.open && !this.blockClosing) {
			this.hide();
		}
	};

	private handleKeyDown = (event: KeyboardEvent) => {
		// Pressing escape when the target element has focus should dismiss the tooltip
		if (this.open && event.key === 'Escape' && !this.blockClosing)
			this.hide();
	};

	@watch('open', { waitUntilFirstUpdate: true })
	protected async handleOpenChange() {
		if (this.disabled)
			return;

		const [ promise, resolve ] = createPromiseResolver<void>();
		this.transitioning = promise;

		if (this.open) {
			// Show
			emitEvent(this, 'show');

			await stopAnimations(this.tooltipQry);
			this.startPositioner();
			this.tooltipQry.hidden = false;
			this.positionerQry.hidden = false;
			const { keyframes, options } = getAnimation(this, 'tooltip.show');
			await animateTo(this.tooltipQry, keyframes, options);

			emitEvent(this, 'after-show');
		}
		else {
			// Hide
			emitEvent(this, 'hide');

			await stopAnimations(this.tooltipQry);
			const { keyframes, options } = getAnimation(this, 'tooltip.hide');
			await animateTo(this.tooltipQry, keyframes, options);
			this.tooltipQry.hidden = true;
			this.positionerQry.hidden = true;
			this.stopPositioner();

			emitEvent(this, 'after-hide');
		}

		resolve();
	}

	@watch('content')
	@watch('distance')
	@watch('hoist')
	@watch('placement')
	@watch('skidding')
	protected handleOptionsChange() {
		this.updatePositioner();
	}

	@watch('disabled')
	protected handleDisabledChange() {
		if (this.disabled && this.open)
			this.hide();
	}

	private hasTrigger(triggerType: string) {
		const triggers = this.trigger.split(' ');

		return triggers.includes(triggerType);
	}

	private startPositioner() {
		this.stopPositioner();
		this.updatePositioner();
		this.positionerCleanup = autoUpdate(this.target, this.positionerQry, this.updatePositioner.bind(this));
	}

	private updatePositioner() {
		if (!this.open || !this.target || !this.positionerQry)
			return;

		computePosition(
			this.target,
			this.positionerQry,
			{
				placement:  this.placement,
				middleware: [
					offset({ mainAxis: this.distance, crossAxis: this.skidding }),
					flip(),
					shift(),
					arrow({
						element: this.arrowQry,
						padding: 0, // min distance from the edge
					}),
				],
				strategy: this.hoist ? 'fixed' : 'absolute',
			},
		).then(({ x, y, middlewareData, placement }) => {
			const arrowX = middlewareData.arrow!.x;
			const arrowY = middlewareData.arrow!.y;
			const side = placement.split('-')[0]!;
			const staticSide = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' }[side]!;

			this.setAttribute('data-placement', placement);

			Object.entries({
				position: this.hoist ? 'fixed' : 'absolute',
				left:     `${ x }px`,
				top:      `${ y }px`,
			}).forEach(([ prop, val ]) => this.positionerQry.style.setProperty(prop, val));

			Object.entries({
				left:         typeof arrowX === 'number' ? `${ arrowX }px` : '',
				top:          typeof arrowY === 'number' ? `${ arrowY }px` : '',
				right:        '',
				bottom:       '',
				[staticSide]: 'calc(var(--tooltip-arrow-size) * -0.6)',
			}).forEach(([ prop, val ]) => this.arrowQry.style.setProperty(prop, val));
		});
	}

	private stopPositioner() {
		if (this.positionerCleanup) {
			this.positionerCleanup();
			this.positionerCleanup = undefined;
			this.removeAttribute('data-placement');
		}
	}
	//#endregion


	//#region template
	private arrowTpl = () => {
		return html`
		<svg width="25" height="11" xmlns="http://www.w3.org/2000/svg" fill="none">
			<path stroke="null" id="svg_1" d="m9.05993,2.36084c-2.65954,3.21996 -6.28892,7.7851
				-8.58153,7.7851l23.91359,0c-2.29263,0 -5.81404,-4.56514
				-8.47363,-7.7851c-1.7721,-2.14551 -5.08631,-2.14551 -6.85842,0z"
			/>
		</svg>
		`;
	};

	public override render() {
		return html`
		<div class="tooltip-positioner">
			<div
				part="base"
				id="tooltip"
				class=${ classMap({ tooltip: true, 'tooltip--open': this.open }) }
				role="tooltip"
				aria-hidden=${ this.open ? 'false' : 'true' }
			>
				<div class="tooltip__arrow">${ this.displayArrow ? this.arrowTpl() : '' }</div>
				<div class="tooltip__content">
					<slot name="content"> ${ this.content } </slot>
				</div>
			</div>
		</div>
		<slot></slot>
		`;
	}
	//#endregion


	//#region style
	public static override styles = tooltipStyles;
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-tooltip': TooltipCmp;
	}
}


setDefaultAnimation('tooltip.show', {
	keyframes: [
		{ opacity: 0 },
		{ opacity: 1 },
	],
	options: { duration: 300, easing: 'ease' },
});

setDefaultAnimation('tooltip.hide', {
	keyframes: [
		{ opacity: 1 },
		{ opacity: 0 },
	],
	options: { duration: 0, easing: 'ease' },
});
