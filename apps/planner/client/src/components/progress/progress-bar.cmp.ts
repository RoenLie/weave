import { LocalizeController } from '@roenlie/lit-utilities/controllers';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


/**
 * @slot - A label to show inside the indicator.
 *
 * @csspart base - The component's internal wrapper.
 * @csspart indicator - The progress bar indicator.
 * @csspart label - The progress bar label.
 *
 * @cssproperty --height - The progress bar's height.
 * @cssproperty --track-color - The track color.
 * @cssproperty --indicator-color - The indicator color.
 * @cssproperty --label-color - The label color.
 */
@customElement('pl-progress-bar')
export class ProgressBarCmp extends LitElement {

	//#region properties
	/** The current progress, 0 to 100. */
	public get value() { return this._value; }
	@property({ type: Number, reflect: true }) public set value(v: number) {
		const old = this._value;
		this._value = Math.max(Math.min(v, 100), 0);
		this.requestUpdate('value', old);
	}

	/** When true, percentage is ignored, the label is hidden,
	 * and the progress bar is drawn in an indeterminate state. */
	@property({ type: Boolean, reflect: true }) public indeterminate = false;

	/** The locale to render the component in. */
	@property() public override lang: string;


	/** A custom label for the progress bar's aria label. */
	@property() public label = '';

	/** Sets the border radius style */
	@property() public shape: 'pill' | 'sharp' = 'sharp';

	protected _value = 0;
	//#endregion


	//#region controllers
	protected readonly localize = new LocalizeController({ host: this });
	//#endregion


	//#region lifecycle
	//#endregion


	//#region logic
	//#endregion


	//#region template
	public override render() {
		return html`
		<div
			part="base"
			class=${ classMap({
				'progress-bar':                  true,
				'progress-bar--indeterminate':   this.indeterminate,
				['progress-bar--' + this.shape]: true,
			}) }
			role="progressbar"
			title=${ ifDefined(this.title) }
			aria-label=${ this.label.length > 0 ? this.label : this.localize.term('progress') }
			aria-valuemin="0"
			aria-valuemax="100"
			aria-valuenow=${ this.indeterminate ? 0 : this._value }
		>
			<div part="indicator"
				class="progress-bar__indicator"
				style=${ styleMap({ width: `${ this._value }%` }) }
			>
				${ when(!this.indeterminate, () => html`
				<pl-text type="label-medium" part="label" class="progress-bar__label">
					<slot></slot>
				</pl-text>
				`) }
			</div>
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		componentStyles,
		css`
		:host {
			--height: 1rem;
			--track-color: var(--surface-variant);
			--label-color: var(--surface-variant);
			--indicator-color: var(--primary);
			display: block;
			width: 100%;
		}
		.progress-bar {
			position: relative;
			background-color: var(--track-color);
			height: var(--height);
			overflow: hidden;
			box-shadow: var(--box-shadow-xs);
		}
		.progress-bar__indicator {
			height: 100%;
			background-color: var(--indicator-color);
			color: var(--label-color);
			text-align: center;
			white-space: nowrap;
			overflow: hidden;
			transition: 400ms width, 400ms background-color;
			user-select: none;
		}
		.progress-bar--sharp,
		.progress-bar--sharp .progress-bar__indicator {
			border-radius: var(--border-radius-xs);
		}
		.progress-bar--pill,
		.progress-bar--pill .progress-bar__indicator {
			border-radius: 500px;
		}
		/* Indeterminate */
		.progress-bar--indeterminate .progress-bar__indicator {
			position: absolute;
			animation: indeterminate 2.5s infinite cubic-bezier(0.37, 0, 0.63, 1);
		}
		@keyframes indeterminate {
			0% {
				inset-inline-start: -50%;
				width: 50%;
			}
			75%,
			100% {
				inset-inline-start: 100%;
				width: 50%;
			}
		}
		`,
	];
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-progress-bar': ProgressBarCmp;
	}
}
