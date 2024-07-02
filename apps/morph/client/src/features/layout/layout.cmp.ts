import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { css, html } from 'lit';

import { NavbarCmp } from './navbar.cmp.js';

NavbarCmp.register();

@customElement('app-layout')
export class AppLayoutCmp extends MimicElement {

	public static page = true;

	protected override render(): unknown {
		return html`
		<m-navbar></m-navbar>
		<slot></slot>
		`;
	}

	public static override styles = [
		css`
		:host {
			overflow: hidden;
			display: grid;
			grid-template-columns: auto 1fr;
			background-color: var(--background);
			color: var(--on-background);
		}
		`,
	];

}
