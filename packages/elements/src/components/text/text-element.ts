import type { stringliteral } from '@roenlie/core/types';
import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { css, html } from 'lit';
import { property, state } from 'lit/decorators.js';


type TextTransform = 'capitalize' | 'uppercase' | 'lowercase' | stringliteral;


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


@customElement('mm-text')
export class MMText extends MimicElement {

	@property({ reflect: true }) public type: TextType = 'body-medium';
	@property({ type: Boolean, reflect: true }) public shadow?: boolean;
	@property() public textTransform?: TextTransform;
	@state() protected text = '';

	protected observer = new MutationObserver(() => this.setText());

	public override connectedCallback() {
		super.connectedCallback();

		this.addEventListener('mousedown', this.handleMousedown);
		this.observer.observe(this, {
			subtree:       true,
			characterData: true,
		});

		this.setText();
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();

		this.removeEventListener('mousedown', this.handleMousedown);
		this.observer.disconnect();
	}

	protected setText() {
		let text = this.textContent ?? '';

		if (this.textTransform === 'uppercase') {
			text = text.toLocaleUpperCase();
		}
		else if (this.textTransform === 'lowercase') {
			text = text.toLocaleLowerCase();
		}
		else if (this.textTransform === 'capitalize') {
			text = text
				.split(' ')
				.map(t => t.slice(0, 1).toLocaleUpperCase() + t.slice(1).toLocaleLowerCase())
				.join(' ');
		}

		this.text = text;
	}

	protected handleMousedown = (ev: MouseEvent) => {
		if (ev.detail >= 2)
			ev.preventDefault();
	};

	public override render() {
		return html`
		<span class="outline" data-content=${ this.text }>${ this.text }</span>
		`;
	}

	public static override styles = [
		css`
		:host {
			position: relative;
			display: inline-block;
		}
		:host([shadow]) .outline {
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
			font-family:    var(--display-large-font-family-name);
			font-weight:    var(--display-large-font-weight);
			font-size:      var(--display-large-font-size);
			line-height:    var(--display-large-line-height);
			letter-spacing: var(--display-large-letter-spacing);
		}
	   :host([type="display-medium"]) {
			font-family:    var(--display-medium-font-family-name);
			font-weight:    var(--display-medium-font-weight);
			font-size:      var(--display-medium-font-size);
			line-height:    var(--display-medium-line-height);
			letter-spacing: var(--display-medium-letter-spacing);
		}
	   :host([type="display-small"]) {
			font-family:    var(--display-small-font-family-name);
			font-weight:    var(--display-small-font-weight);
			font-size:      var(--display-small-font-size);
			line-height:    var(--display-small-line-height);
			letter-spacing: var(--display-small-letter-spacing);
		}
	   :host([type="headline-large"]) {
			font-family:    var(--headline-large-font-family-name);
			font-weight:    var(--headline-large-font-weight);
			font-size:      var(--headline-large-font-size);
			line-height:    var(--headline-large-line-height);
			letter-spacing: var(--headline-large-letter-spacing);
		}
	   :host([type="headline-medium"]) {
			font-family:    var(--headline-medium-font-family-name);
			font-weight:    var(--headline-medium-font-weight);
			font-size:      var(--headline-medium-font-size);
			line-height:    var(--headline-medium-line-height);
			letter-spacing: var(--headline-medium-letter-spacing);
		}
	   :host([type="headline-small"]) {
			font-family:    var(--headline-small-font-family-name);
			font-weight:    var(--headline-small-font-weight);
			font-size:      var(--headline-small-font-size);
			line-height:    var(--headline-small-line-height);
			letter-spacing: var(--headline-small-letter-spacing);
		}
	   :host([type="body-large"]) {
			font-family:    var(--body-large-font-family-name);
			font-weight:    var(--body-large-font-weight);
			font-size:      var(--body-large-font-size);
			line-height:    var(--body-large-line-height);
			letter-spacing: var(--body-large-letter-spacing);
		}
	   :host([type="body-medium"]) {
			font-family:    var(--body-medium-font-family-name);
			font-weight:    var(--body-medium-font-weight);
			font-size:      var(--body-medium-font-size);
			line-height:    var(--body-medium-line-height);
			letter-spacing: var(--body-medium-letter-spacing);
		}
	   :host([type="body-small"]) {
			font-family:    var(--body-small-font-family-name);
			font-weight:    var(--body-small-font-weight);
			font-size:      var(--body-small-font-size);
			line-height:    var(--body-small-line-height);
			letter-spacing: var(--body-small-letter-spacing);
		}
	   :host([type="label-large"]) {
			font-family:    var(--label-large-font-family-name);
			font-weight:    var(--label-large-font-weight);
			font-size:      var(--label-large-font-size);
			line-height:    var(--label-large-line-height);
			letter-spacing: var(--label-large-letter-spacing);
		}
	   :host([type="label-medium"]) {
			font-family:    var(--label-medium-font-family-name);
			font-weight:    var(--label-medium-font-weight);
			font-size:      var(--label-medium-font-size);
			line-height:    var(--label-medium-line-height);
			letter-spacing: var(--label-medium-letter-spacing);
		}
	   :host([type="label-small"]) {
			font-family:    var(--label-small-font-family-name);
			font-weight:    var(--label-small-font-weight);
			font-size:      var(--label-small-font-size);
			line-height:    var(--label-small-line-height);
			letter-spacing: var(--label-small-letter-spacing);
		}
	   :host([type="title-large"]) {
			font-family:    var(--title-large-font-family-name);
			font-weight:    var(--title-large-font-weight);
			font-size:      var(--title-large-font-size);
			line-height:    var(--title-large-line-height);
			letter-spacing: var(--title-large-letter-spacing);
		}
	   :host([type="title-medium"]) {
			font-family:    var(--title-medium-font-family-name);
			font-weight:    var(--title-medium-font-weight);
			font-size:      var(--title-medium-font-size);
			line-height:    var(--title-medium-line-height);
			letter-spacing: var(--title-medium-letter-spacing);
		}
	   :host([type="title-small"]) {
			font-family:    var(--title-small-font-family-name);
			font-weight:    var(--title-small-font-weight);
			font-size:      var(--title-small-font-size);
			line-height:    var(--title-small-line-height);
			letter-spacing: var(--title-small-letter-spacing);
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'mm-text': MMText;
	}
}
