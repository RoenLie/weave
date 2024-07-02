import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


@customElement('pl-layout-page')
export class LayoutPageCmp extends LitElement {

	public override render() {
		return html`
			<nav>
				<pl-nav-rail></pl-nav-rail>
			</nav>

			<main>
				<slot></slot>
			</main>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			display: grid;
			grid-template-areas: "nav main";
			grid-template-columns: 100px 1fr;
			grid-template-rows: 1fr;
			overflow: hidden;
		}
		nav {
			grid-area: nav;
			overflow: auto;
			border-right: 1px solid var(--outline-variant);
			--scrollbar-width: 4px;
			--scrollbar-height: 4px;
		}
		main {
			grid-area: main;
			overflow: auto;
		}

		@media (max-width: 800px) {
			:host {
				grid-template-areas: "main" "nav";
				grid-template-columns: 1fr;
				grid-template-rows: 1fr 100px;
			}
			nav {
				border: none;
				border-top: 1px solid var(--outline-variant);
			}
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-layout-page': LayoutPageCmp;
	}
}
