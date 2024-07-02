import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


@customElement('pl-calendar-page')
export class CalendarPageCmp extends LitElement {

	public override render() {
		return html`
			<div>new-component</div>
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
		'pl-calendar-page': CalendarPageCmp;
	}
}
