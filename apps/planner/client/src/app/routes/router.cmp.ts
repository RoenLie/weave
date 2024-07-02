import { RouteHistoryUrl } from '@roenlie/lit-router';
import { css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';
import { router } from './router.js';
import { generateRoutes } from './routes.js';


@customElement('pl-router')
export class RouterElement extends LitElement {

	public override connectedCallback() {
		super.connectedCallback();

		router.setHistorian(new RouteHistoryUrl());
		router.setOutlet(this);
		router.setRoutes(generateRoutes());
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			display: grid;
			position: relative;
			overflow:hidden;
		}
		`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-router': RouterElement;
	}
}
