import { html, LitElement } from 'lit';

import { customElement } from 'lit/decorators.js';
import { Routes, type RouteConfig } from '@lit-labs/router';
import { provide } from '@roenlie/lit-context';
import { sharedStyles } from '../app/shared-styles.ts';
import mainStyles from './main.css' with { type: 'css' };
import { isMobile } from '@roenlie/core/dom';


export const mainRoutesID = 'main-routes';


@customElement('syn-main')
export class MainCmp extends LitElement {

	protected mobileRoutes: RouteConfig[] = [
		{
			path:   '',
			name:   'Search',
			enter:  () => !!import('../pages/search/search-page.ts'),
			render: () => html`<syn-search-page></syn-search-page>`,
		},
		{
			path:   'upload',
			name:   'upload',
			enter:  () => !!import('../pages/capture/capture-page.ts'),
			render: () => html`<syn-capture-page></syn-capture-page>`,
		},
		{
			path:   'capture/*',
			name:   'Capture',
			enter:  () => !!import('../pages/capture/capture-page.ts'),
			render: () => html`<syn-capture-page></syn-capture-page>`,
		},
	];

	protected desktopRoutes: RouteConfig[] = [
		{
			path:   '',
			name:   'Search',
			enter:  () => !!import('../pages/search/search-page.ts'),
			render: () => html`<syn-search-page></syn-search-page>`,
		},
	];

	@provide(mainRoutesID) protected routes = new Routes(
		this, isMobile ? this.mobileRoutes : this.desktopRoutes,
		{
			fallback: {
				render: () => html`Not Found`,
			},
		},
	);

	protected renderMobile() {
		return html`
		${ this.routes.outlet() }

		<nav>
			<a tabindex="-1" href=${ this.routes.link('upload') }>
				<button synapse outlined>
					Upload
				</button>
			</a>
			<a tabindex="-1" href=${ this.routes.link('capture/camera') }>
				<button synapse outlined>
					Capture
				</button>
			</a>
		</nav>
		`;
	}

	protected renderDesktop() {
		return html`
		${ this.routes.outlet() }
		`;
	}

	protected override render() {
		return isMobile ? this.renderMobile() : this.renderDesktop();
	}

	public static override styles = [
		sharedStyles,
		mainStyles,
	];

}
