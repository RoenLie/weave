import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';


type ButtonType = '' | 'icon';
type ButtonSize = 'x-small' | 'small' | 'medium' | 'large' | 'x-large';
type ButtonShape = 'sharp' | 'rounded' | 'pill';
type ButtonVariant =
| 'primary'
| 'primary-variant'
| 'secondary'
| 'tertiary'
| 'neutral'
| 'error'
| 'elevated'
| 'warning'
| 'success'
| 'text'
| 'outline';


@customElement('pl-button')
export class ButtonCmp extends LitElement {

	@property({ type: String }) public type:    ButtonType    = '';
	@property() public size:    ButtonSize    = 'medium';
	@property() public shape:   ButtonShape   = 'pill';
	@property() public variant: ButtonVariant = 'primary';
	@property({ type: Boolean, reflect: true }) public disabled?: boolean;

	public override render() {
		return html`
		<pl-ripple class=${ classMap({
			[this.type]:    true,
			[this.size]:    true,
			[this.shape]:   true,
			[this.variant]: true,
		}) }>
			<button part="base" class="base">
				<slot name="prefix"></slot>
				<slot></slot>
				<slot name="suffix"></slot>
			</button>
		</pl-ripple>
		`;
	}

	public static override styles = [
		css`
		:host {
			position: relative;
			display: block;
			width: fit-content;
			height: fit-content;
			text-align: initial;
			--color-button-bg: 0 0 0;
			--color-button-txt: 0 0 0;
		}
		button {
			all: unset;
			position: relative;
			display: grid;
			grid-template-areas: "prefix text suffix";
			grid-template-columns: auto 1fr auto;
			align-items: center;
			padding-inline: var(--spacing-xxl);
			background-color: var(--color-button-bg);
			color: var(--color-button-txt);
			cursor: pointer;
		}
		button:focus-visible::after {
			content: '';
			inset: 0;
			position: absolute;
			outline: var(--focus-ring);
			outline-offset: var(--focus-offset);
			transition: var(--focus-transition);
			z-index: var(--focus-index);
			border-radius: inherit;
		}
		button:active::after {
			outline-offset: 1px;
		}
		.icon button {
			padding: 0;
			aspect-ratio: 1;
		}
		.x-small button {
			height: 20px;
		}
		.small button {
			height: 30px;
		}
		.medium button {
			height: 40px;
		}
		.large button {
			height: 50px;
		}
		.x-large button {
			height: 60px;
		}
		.sharp button,
		pl-ripple.sharp {
			border-radius: var(--border-radius-xs);
		}
		.rounded button,
		pl-ripple.rounded {
			border-radius: var(--border-radius-m);
		}
		.pill button,
		pl-ripple.pill {
			border-radius: var(--border-pill);
		}
		.primary {
			--ripple-bg: var(--on-primary-press);
			--color-button-bg: var(--primary);
			--color-button-txt: var(--on-primary);
		}
		.primary-variant {
			--ripple-bg: var(--on-primary-container-press);
			--color-button-bg: var(--primary-container);
			--color-button-txt: var(--on-primary-container);
		}
		.secondary {
			--ripple-bg: var(--on-secondary-container-press);
			--color-button-bg: var(--secondary-container);
			--color-button-txt: var(--on-secondary-container);
		}
		.tertiary {
			--ripple-bg: var(--on-tertiary-container-press);
			--color-button-bg: var(--tertiary-container);
			--color-button-txt: var(--on-tertiary-container);
		}
		.neutral {
			--ripple-bg: var(--on-surface-variant-press);
			--color-button-bg: var(--surface-variant);
			--color-button-txt: var(--on-surface-variant);
		}
		.error {
			--ripple-bg: var(--on-error-container-press);
			--color-button-bg: var(--error-container);
			--color-button-txt: var(--on-error-container);
		}
		.warning {
			--ripple-bg: var(--on-warning-press);
			--color-button-bg: var(--warning);
			--color-button-txt: var(--on-warning);
		}
		.success {
			--ripple-bg: var(--on-success-container-press);
			--color-button-bg: var(--success-container);
			--color-button-txt: var(--on-success-container);
		}
		.text {
			--ripple-bg: var(--primary-press);
			--color-button-bg: none;
			--color-button-txt: var(--primary);
		}
		.outline {
			--ripple-bg: var(--primary-press);
			--color-button-txt: var(--primary);
		}
		.outline button {
			outline: 1px solid var(--outline);
		}
		.elevated {
			--ripple-bg: var(--primary-press);
			--color-button-txt: var(--primary);
			backdrop-filter: blur(2px);
		}
		.text button,
		.outline button,
		.elevated button {
			transition: box-shadow var(--transition-fast) ease-in-out;
		}
		.elevated button {
			box-shadow: var(--box-shadow-s);
		}
		.text:hover button,
		.outline:hover button,
		.elevated:hover button {
			box-shadow: var(--box-shadow-m);
		}

		::slotted(*) {
			grid-area: text;
		}
		slot[name=prefix]::slotted(*) {
			grid-area: prefix;
			padding-right: var(--spacing-s);
			margin-left: -8px;
		}
		slot[name=suffix]::slotted(*) {
			grid-area: suffix;
			padding-left: var(--spacing-s);
			margin-right: -8px;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-button': ButtonCmp;
	}
}
