import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { nanoid } from 'nanoid';
import { atom, react } from 'signia';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


const color = atom('color', 'red');


@customElement('pl-profile-page')
export class ProfilePageCmp extends LitElement {

	#stop: () => void;

	public override connectedCallback(): void {
		super.connectedCallback();

		this.#stop = react(this.tagName, () => {
			this.requestUpdate();
			color.value;
		});
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.#stop?.();
	}

	public override render() {
		return html`
			<div>new-component</div>
			<button @click=${ () => {
				color.set(nanoid());
			} }>DO iT</button>
			<h1>${ color.value }</h1>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			display: grid;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-profile-page': ProfilePageCmp;
	}
}
