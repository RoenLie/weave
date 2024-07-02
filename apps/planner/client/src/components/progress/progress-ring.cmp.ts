import { LocalizeController } from '@roenlie/lit-utilities/controllers';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


/**
 * @slot - A label to show inside the ring.
 *
 * @csspart base - The component's internal wrapper.
 * @csspart label - The progress ring label.
 *
 * @cssproperty --size - The diameter of the progress ring (cannot be a percentage).
 * @cssproperty --track-width - The width of the track.
 * @cssproperty --track-color - The color of the track.
 * @cssproperty --indicator-width - The width of the indicator. Defaults to the track width.
 * @cssproperty --indicator-color - The indicator color.
 */
@customElement('pl-progress-ring')
export class ProgressRingCmp extends LitElement {

	//#region properties
	/** The current progress, 0 to 100. */
	@property({ type: Number, reflect: true }) public value = 0;

	/** A custom label for the progress ring's aria label. */
	@property() public label = '';

	@state() protected indicatorOffset: string;

	@query('.progress-ring__indicator') protected indicator: SVGCircleElement;
	//#endregion


	//#region controllers
	protected readonly localize = new LocalizeController({ host: this });
	//#endregion


	//#region lifecycle
	protected override willUpdate(changedProps: Map<string, unknown>) {
		super.willUpdate(changedProps);

		/**
		 * This block is only required for Safari because it doesn't transition the circle when the custom properties
		 * change, possibly because of a mix of pixel + unit-less values in the calc() function. It seems like a Safari bug,
		 * but I couldn't pinpoint it so this works around the problem.
		 */
		if (this.hasUpdated && changedProps.has('value')) {
			const radius = parseFloat(getComputedStyle(this.indicator).getPropertyValue('r'));
			const circumference = 2 * Math.PI * radius;
			const offset = circumference - (this.value / 100) * circumference;

			this.indicatorOffset = `${ offset }px`;
		}
	}
	//#endregion


	//#region logic
	//#endregion


	//#region template
	public override render() {
		return html`
		<div
			part="base"
			class="progress-ring"
			role="progressbar"
			aria-label=${ this.label.length > 0 ? this.label : this.localize.term('progress') }
			aria-valuemin="0"
			aria-valuemax="100"
			aria-valuenow="${ this.value }"
			style="--percentage: ${ this.value / 100 }"
		>
			<svg class="progress-ring__image">
				<circle class="progress-ring__track"></circle>
				<circle class="progress-ring__indicator" style="stroke-dashoffset: ${ this.indicatorOffset }"></circle>
			</svg>
			<span part="label" class="progress-ring__label">
				<slot></slot>
			</span>
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		componentStyles,
		css`
		:host {
			--size: 128px;
			--track-width: 4px;
			--track-color: var(--surface-variant);
			--indicator-width: var(--track-width);
			--indicator-color: var(--primary);
			display: inline-flex;
		}
		.progress-ring {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			position: relative;
		}
		.progress-ring__image {
			width: var(--size);
			height: var(--size);
			transform: rotate(-90deg);
			transform-origin: 50% 50%;
		}
		.progress-ring__track,
		.progress-ring__indicator {
			--radius: calc(var(--size) / 2 - max(var(--track-width), var(--indicator-width)) * 0.5);
			--circumference: calc(var(--radius) * 2 * 3.141592654);
			fill: none;
			r: var(--radius);
			cx: calc(var(--size) / 2);
			cy: calc(var(--size) / 2);
		}
		.progress-ring__track {
			stroke: var(--track-color);
			stroke-width: var(--track-width);
		}
		.progress-ring__indicator {
			stroke: var(--indicator-color);
			stroke-width: var(--indicator-width);
			stroke-linecap: round;
			transition: 0.35s stroke-dashoffset;
			stroke-dasharray: var(--circumference) var(--circumference);
			stroke-dashoffset: calc(var(--circumference) - var(--percentage) * var(--circumference));
		}
		.progress-ring__label {
			display: flex;
			align-items: center;
			justify-content: center;
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			text-align: center;
			user-select: none;
		}
		`,
	];
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-progress-ring': ProgressRingCmp;
	}
}
