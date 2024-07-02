import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

import { router } from '../../app/routes/router.js';
import { componentStyles } from '../../features/shared-styles/component-styles.js';
import { demoRoutes } from './demo-routes.js';


@customElement('pl-demo-page')
export class DemoPageCmp extends LitElement {

	@state() protected activeLink = '';

	public override connectedCallback(): void {
		super.connectedCallback();

		window.addEventListener('popstate', this.handlePopstate);
		this.handlePopstate();
	}

	public override disconnectedCallback(): void {
		super.connectedCallback();
		window.removeEventListener('popstate', this.handlePopstate);
	}

	protected handlePopstate = () => {
		const path = location.pathname;
		this.activeLink = path;
	};

	public override render() {
		return html`
		<pl-sub-nav>
		${ map(demoRoutes, route => {
			const path = '/demo' + route.path;

			return html`
			<pl-sub-nav-item
				role="link"
				@click=${ () => router.navigate(path) }
				?active=${ this.activeLink.includes(path) }
			>
				<pl-text>${ route.name }</pl-text>
			</pl-sub-nav-item>
			`;
		}) }
		</pl-sub-nav>

		<main>
			<slot></slot>
		</main>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			height: 100%;
			display: grid;
			grid-template-areas: "main nav";
			grid-template-columns: 1fr 150px;
			grid-template-rows: 1fr;
			overflow: hidden;
		}
		main {
			grid-area: main;
			overflow: auto;
			padding: 12px;
		}
		pl-sub-nav {
			grid-area: nav;
			overflow: auto;
			border-left: 1px solid var(--outline-variant);
		}
		pl-sub-nav-item::part(base) {
			place-items: center;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-demo-page': DemoPageCmp;
	}
}
