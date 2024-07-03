import { emitEvent, type EventOf, hasKeyboardFocus } from '@roenlie/core/dom';
import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';


type InputSize = 'small' | 'medium' | 'large';
type InputShape = 'sharp' | 'rounded' | 'pill';


@customElement('mm-input')
export class MMInput extends MimicElement {

	@property() public label = '';
	@property() public value = '';
	@property() public placeholder = '';
	@property() public type: 'text' | 'number' = 'text';
	@property({ type: Boolean, reflect: true }) public disabled?: boolean;
	@property({ type: Boolean, reflect: true }) public readonly?: boolean;
	@property({ reflect: true }) public size: InputSize = 'medium';
	@property({ reflect: true }) public shape: InputShape = 'sharp';
	@property({ type: Boolean, reflect: true, attribute: 'auto-focus' }) public autoFocus?: boolean;
	@state() protected hasKeyboardFocus = false;
	@query('input') protected inputQry: HTMLInputElement;

	public get valueAsNumber() {
		return Number(this.value);
	}

	protected get classes() {
		return {
			[this.size]:  true,
			[this.shape]: true,
			label:        !!this.label,
			filled:       this.value || this.placeholder,
			placeholder:  !this.value && this.placeholder,
			disabled:     !!this.disabled,
			focused:      this.inputQry?.matches(':focus-within') ?? false,
		};
	}

	public override connectedCallback(): void {
		super.connectedCallback();

		if (this.autoFocus)
			requestAnimationFrame(() => this.inputQry.focus({ preventScroll: true }));
	}

	public override focus(options?: FocusOptions | undefined) {
		this.inputQry.focus(options);
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

	protected preventDefault(ev: Event) {
		ev.preventDefault();
	}

	public override render() {
		return html`
		<div class=${ classMap({ base: true, ...this.classes }) }>
			<label class=${ classMap({ input__base: true, ...this.classes }) }>
				<slot-wrapper @click=${ this.preventDefault }>
					<slot name="start"></slot>
				</slot-wrapper>
				<input
					type        =${ this.type === 'number' ? 'number' : 'text' }
					inputmode   =${ this.type === 'number' ? 'numeric' : 'text' }
					.value      =${ live(this.value) }
					.placeholder=${ this.placeholder }
					?disabled   =${ this.disabled }
					?readonly   =${ this.readonly }
					@focus      =${ this.handleFocus }
					@blur       =${ this.handleBlur }
					@input      =${ this.handleInput }
					@change     =${ this.handleChange }
				/>
				<span>${ this.label }</span>
				<slot-wrapper @click=${ this.preventDefault }>
					<slot name="end"></slot>
				</slot-wrapper>
			</label>
		</div>
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			display: flex;
		}
		.base {
			position: relative;
			width: 100%;
			display: grid;
		}
		.base.disabled {
			opacity: 0.7;
		}
		.sharp {
			border-radius: var(--mm-border-radius-xs);
		}
		.rounded  {
			border-radius: var(--mm-border-radius-m);
		}
		.pill  {
			border-radius: var(--mm-border-pill);
		}
		.small {
			height: 30px;
			font-size: 12px;
		}
		.small span {
			top: 8px;
		}
		label.small.focused span,
		label.small.filled span {
			top: 4px;
			font-size: 8px;
		}
		.small.label input {
			padding-top: 12px;
		}
		.medium {
			height: 40px;
			font-size: 14px;
		}
		.medium span {
			top: 12px;
		}
		label.medium.focused span,
		label.medium.filled span {
			top: 5px;
			font-size: 10px;
		}
		.medium.label input {
			padding-top: 14px;
		}
		.large {
			height: 50px;
			font-size: 16px;
		}
		.large span {
			top: 16px;
		}
		label.large.focused span,
		label.large.filled span {
			top: 6px;
			font-size: 12px;
		}
		.large.label input {
			padding-top: 18px;
		}
		label {
			position: relative;
			display: grid;
			grid-template: "start input end" 1fr / max-content 1fr max-content;
			padding-inline: 12px;
			background-color: rgb(var(--mm-color-on-surface) / .04);
		}
		label>:first-of-type(slot-wrapper) {
			grid-area: start;
		}
		label>input {
			grid-area: input;
		}
		label>:last-of-type(slot-wrapper) {
			grid-area: end;
		}
		label.focused span,
		label.filled span {
			color: var(--mm-primary);
		}
		span {
			line-height: 1em;
			pointer-events: none;
			position: absolute;
			left: 0px;
			padding-inline: 12px;
			color: rgb(var(--mm-color-on-surface) / 0.6);
			transition: color 0.2s ease 0s, font-size 0.2s ease 0s, top 0.2s ease 0s;
		}
		label::before {
			content: '';
			position: absolute;
			bottom: 0px;
			height: 1px;
			width: 100%;
			background-color: rgb(var(--mm-color-on-surface) / 0.6)
		}
		label::after {
			content: '';
			position: absolute;
			left: 0px;
			bottom: 0px;
			height: 1px;
			background-color: var(--mm-primary);
			width: 100%;
			transform-origin: center bottom;
			transform: scaleX(0);
			transition: transform 0.3s ease 0s;
		}
		label.focused::after {
			transform: scaleX(1);
		}
		input {
			all: unset;
			width: 100%;
			line-height: 1em;
			color: rgb(var(--mm-color-on-surface) / 0.87);
			caret-color: var(--mm-primary);
		}
		.placeholder input {
			color: rgb(var(--mm-color-on-surface) / 0.3);
		}
		input::-moz-selection {
			color: var(--mm-on-primary);
			background: var(--mm-primary);
		}
		input::selection {
			color: var(--mm-on-primary);
			background: var(--mm-primary);
		}
		slot-wrapper {
			display: grid;
			place-items: center;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'mm-input': MMInput;
	}
}
