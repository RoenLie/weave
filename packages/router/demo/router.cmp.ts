import { css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { RouteHistoryUrl } from '../src/route-history-url.js';
import { router } from './router-instance.js';
import { generateRoutes } from './routes.js';


@customElement('ha-router')
export class HARouter extends LitElement {

	public override connectedCallback() {
		super.connectedCallback();

		router.setHistorian(new RouteHistoryUrl());
		router.setOutlet(this);
		router.setRoutes(generateRoutes(this));
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();
	}

	public static override styles = [
		css`
		:host {
			position: relative;
			display: flex;
			flex-flow: column nowrap;
			height: 100%;
			overflow:hidden;
		}
		`,
	];

}
