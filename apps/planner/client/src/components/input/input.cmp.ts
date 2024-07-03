import { paintCycle } from '@roenlie/core/async';
import { emitEvent, EventOf, hasKeyboardFocus } from '@roenlie/core/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


type InputSize = 'small' | 'medium' | 'large';
type InputShape = 'sharp' | 'rounded' | 'pill';


@customElement('pl-input')
export class InputCmp extends LitElement {

	@property() public label = '';
	@property() public value = '';
	@property() public placeholder = '';
	@property({ reflect: true }) public size: InputSize = 'medium';
	@property({ reflect: true }) public shape: InputShape = 'sharp';
	@property({ type: Boolean, reflect: true, attribute: 'auto-focus' }) public autoFocus?: boolean;
	@state() protected hasKeyboardFocus = false;
	@query('input') protected inputQry: HTMLInputElement;

	protected get classes() {
		return {
			[this.size]:  true,
			[this.shape]: true,
			filled:       this.value || this.placeholder,
			placeholder:  !this.value && this.placeholder,
		};
	}

	public override connectedCallback(): void {
		super.connectedCallback();

		if (this.autoFocus)
			paintCycle().then(() => this.inputQry.focus());
	}

	protected handleFocus = () => {
		this.hasKeyboardFocus = hasKeyboardFocus(this.inputQry);
	};

	protected handleBlur = () => {
		this.hasKeyboardFocus = false;
	};

	protected handleInput = (ev: EventOf<HTMLInputElement>) => {
		this.value = ev.target.value;
	};

	protected handleChange() {
		this.value = this.inputQry.value;
		emitEvent(this, 'change');
	}

	public override render() {
		return html`
		<div class=${ classMap({ base: true, ...this.classes }) }>
			<label class=${ classMap({ input__base: true, ...this.classes }) }>
				<input
					.value=${ this.value }
					.placeholder=${ this.placeholder }
					@focus=${ this.handleFocus }
					@blur=${ this.handleBlur }
					@input=${ this.handleInput }
					@change=${ this.handleChange }
				/>
				<span>${ this.label }</span>
			</label>
		</div>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			display: flex;
		}
		.base {
			position: relative;
			display: grid;
			width: 100%;
		}
		.sharp {
			border-radius: var(--border-radius-xs);
		}
		.rounded  {
			border-radius: var(--border-radius-m);
		}
		.pill  {
			border-radius: var(--border-pill);
		}

		.small {
			height: 30px;
			font-size: 12px;
		}
		.small span {
			top: 8px;
		}
		label.small:focus-within span,
		label.small.filled span {
			top: 4px;
			font-size: 8px;
		}
		.small input {
			padding-top: 12px;
		}

		.medium {
			height: 40px;
			font-size: 14px;
		}
		.medium span {
			top: 12px;
		}
		label.medium:focus-within span,
		label.medium.filled span {
			top: 5px;
			font-size: 10px;
		}
		.medium input {
			padding-top: 14px;
		}

		.large {
			height: 50px;
			font-size: 16px;
		}
		.large span {
			top: 16px;
		}
		label.large:focus-within span,
		label.large.filled span {
			top: 6px;
			font-size: 12px;
		}
		.large input {
			padding-top: 18px;
		}

		label {
			position: relative;
			display: grid;
			overflow: hidden;
			background-color: rgb(var(--color-on-surface) / .04);
		}
		label:focus-within span,
		label.filled span {
			color: var(--primary);
		}
		span {
			line-height: 1em;
			pointer-events: none;
			position: absolute;
			left: 0px;
			padding-inline: 12px;
			color: rgb(var(--color-on-surface) / 0.6);
			transition: color 0.2s ease 0s, font-size 0.2s ease 0s, top 0.2s ease 0s;
		}
		label::before {
			content: '';
			position: absolute;
			bottom: 0px;
			height: 1px;
			width: 100%;
			background-color: rgb(var(--color-on-surface) / 0.6)
		}
		label::after {
			content: '';
			position: absolute;
			left: 0px;
			bottom: 0px;
			height: 2px;
			background-color: var(--primary);
			width: 100%;
			transform-origin: center bottom;
			transform: scaleX(0);
			transition: transform 0.3s ease 0s;
		}
		label:focus-within::after {
			transform: scaleX(1);
		}
		input {
			all: unset;
			padding-inline: 12px;
			line-height: 1em;
			color: rgb(var(--color-on-surface) / 0.87);
			caret-color: var(--primary);
		}
		.placeholder input {
			color: rgb(var(--color-on-surface) / 0.3);
		}

		input::-moz-selection {
			color: var(--on-primary);
			background: var(--primary);
		}
		input::selection {
			color: var(--on-primary);
			background: var(--primary);
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-input': InputCmp;
	}
}
