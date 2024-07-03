import { StringLiteral } from '@roenlie/core/types';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';


type TextTransform = 'capitalize' | 'uppercase' | 'lowercase' | StringLiteral;


type TextType = 'display-large'
| 'display-medium'
| 'display-small'
| 'headline-large'
| 'headline-medium'
| 'headline-small'
| 'body-large'
| 'body-medium'
| 'body-small'
| 'label-large'
| 'label-medium'
| 'label-small'
| 'title-large'
| 'title-medium'
| 'title-small';


@customElement('pl-text')
export class TextCmp extends LitElement {

	@property({ reflect: true }) public type: TextType = 'body-medium';
	@property({ type: Boolean, reflect: true }) public shadow?: boolean;
	@property() public textTransform: TextTransform = 'capitalize';
	@state() protected text = '';

	public override connectedCallback(): void {
		super.connectedCallback();
		this.setAttribute('inert', '');

		this.addEventListener('mousedown', this.handleMousedown);

		this.updateComplete.then(() => this.handleSlotchange());
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.removeEventListener('mousedown', this.handleMousedown);
	}

	protected handleMousedown = (ev: MouseEvent) => {
		if (ev.detail >= 2)
			ev.preventDefault();
	};

	protected handleSlotchange = () => {
		let text = this.textContent ?? '';
		if (this.textTransform === 'uppercase')
			text = text.toLocaleUpperCase();
		else if (this.textTransform === 'lowercase')
			text = text.toLocaleLowerCase();
		else if (this.textTransform === 'capitalize')
			text = text.slice(0, 1).toLocaleUpperCase() + text.slice(1).toLocaleLowerCase();

		this.text = text;
	};

	public override render() {
		return html`
		<span class="outline" data-content=${ this.text }>${ this.text }</span>
		<slot @slotchange=${ this.handleSlotchange } style="display:none;"></slot>
		`;
	}

	public static override styles = [
		css`
		:host {
			position: relative;
			display: inline-block;
		}
		:host([shadow]) .outlidne {
			color: var(--on-background);
			-webkit-text-stroke: 1px black;
		}
		:host([shadow]) .outline::before {
			content: attr(data-content);
			-webkit-text-fill-color: var(--on-background);
			-webkit-text-stroke: 0;
			position: absolute;
			pointer-events: none;
		}
		:host([type="display-large"]) {
			font-family: var(--typescale-display-large-font-family-name);
			font-weight: var(--typescale-display-large-font-weight);
			font-size: var(--typescale-display-large-font-size);
			line-height: var(--typescale-display-large-line-height);
			letter-spacing: var(--typescale-display-large-letter-spacing);
		}
	   :host([type="display-medium"]) {
			font-family: var(--typescale-display-medium-font-family-name);
			font-weight: var(--typescale-display-medium-font-weight);
			font-size: var(--typescale-display-medium-font-size);
			line-height: var(--typescale-display-medium-line-height);
			letter-spacing: var(--typescale-display-medium-letter-spacing);
		}
	   :host([type="display-small"]) {
			font-family: var(--typescale-display-small-font-family-name);
			font-weight: var(--typescale-display-small-font-weight);
			font-size: var(--typescale-display-small-font-size);
			line-height: var(--typescale-display-small-line-height);
			letter-spacing: var(--typescale-display-small-letter-spacing);
		}
	   :host([type="headline-large"]) {
			font-family: var(--typescale-headline-large-font-family-name);
			font-weight: var(--typescale-headline-large-font-weight);
			font-size: var(--typescale-headline-large-font-size);
			line-height: var(--typescale-headline-large-line-height);
			letter-spacing: var(--typescale-headline-large-letter-spacing);
		}
	   :host([type="headline-medium"]) {
			font-family: var(--typescale-headline-medium-font-family-name);
			font-weight: var(--typescale-headline-medium-font-weight);
			font-size: var(--typescale-headline-medium-font-size);
			line-height: var(--typescale-headline-medium-line-height);
			letter-spacing: var(--typescale-headline-medium-letter-spacing);
		}
	   :host([type="headline-small"]) {
			font-family: var(--typescale-headline-small-font-family-name);
			font-weight: var(--typescale-headline-small-font-weight);
			font-size: var(--typescale-headline-small-font-size);
			line-height: var(--typescale-headline-small-line-height);
			letter-spacing: var(--typescale-headline-small-letter-spacing);
		}
	   :host([type="body-large"]) {
			font-family: var(--typescale-body-large-font-family-name);
			font-weight: var(--typescale-body-large-font-weight);
			font-size: var(--typescale-body-large-font-size);
			line-height: var(--typescale-body-large-line-height);
			letter-spacing: var(--typescale-body-large-letter-spacing);
		}
	   :host([type="body-medium"]) {
			font-family: var(--typescale-body-medium-font-family-name);
			font-weight: var(--typescale-body-medium-font-weight);
			font-size: var(--typescale-body-medium-font-size);
			line-height: var(--typescale-body-medium-line-height);
			letter-spacing: var(--typescale-body-medium-letter-spacing);
		}
	   :host([type="body-small"]) {
			font-family: var(--typescale-body-small-font-family-name);
			font-weight: var(--typescale-body-small-font-weight);
			font-size: var(--typescale-body-small-font-size);
			line-height: var(--typescale-body-small-line-height);
			letter-spacing: var(--typescale-body-small-letter-spacing);
		}
	   :host([type="label-large"]) {
			font-family: var(--typescale-label-large-font-family-name);
			font-weight: var(--typescale-label-large-font-weight);
			font-size: var(--typescale-label-large-font-size);
			line-height: var(--typescale-label-large-line-height);
			letter-spacing: var(--typescale-label-large-letter-spacing);
		}
	   :host([type="label-medium"]) {
			font-family: var(--typescale-label-medium-font-family-name);
			font-weight: var(--typescale-label-medium-font-weight);
			font-size: var(--typescale-label-medium-font-size);
			line-height: var(--typescale-label-medium-line-height);
			letter-spacing: var(--typescale-label-medium-letter-spacing);
		}
	   :host([type="label-small"]) {
			font-family: var(--typescale-label-small-font-family-name);
			font-weight: var(--typescale-label-small-font-weight);
			font-size: var(--typescale-label-small-font-size);
			line-height: var(--typescale-label-small-line-height);
			letter-spacing: var(--typescale-label-small-letter-spacing);
		}
	   :host([type="title-large"]) {
			font-family: var(--typescale-title-large-font-family-name);
			font-weight: var(--typescale-title-large-font-weight);
			font-size: var(--typescale-title-large-font-size);
			line-height: var(--typescale-title-large-line-height);
			letter-spacing: var(--typescale-title-large-letter-spacing);
		}
	   :host([type="title-medium"]) {
			font-family: var(--typescale-title-medium-font-family-name);
			font-weight: var(--typescale-title-medium-font-weight);
			font-size: var(--typescale-title-medium-font-size);
			line-height: var(--typescale-title-medium-line-height);
			letter-spacing: var(--typescale-title-medium-letter-spacing);
		}
	   :host([type="title-small"]) {
			font-family: var(--typescale-title-small-font-family-name);
			font-weight: var(--typescale-title-small-font-weight);
			font-size: var(--typescale-title-small-font-size);
			line-height: var(--typescale-title-small-line-height);
			letter-spacing: var(--typescale-title-small-letter-spacing);
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-text': TextCmp;
	}
}
