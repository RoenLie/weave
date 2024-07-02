import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


@customElement('pl-home-page')
export class HomePageCmp extends LitElement {


	public override render() {
		return html`
			<pl-pending-submissions></pl-pending-submissions>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			display: block;
		}
	`,
	];


}
declare global {
	interface HTMLElementTagNameMap {
		'pl-home-page': HomePageCmp;
	}
}
