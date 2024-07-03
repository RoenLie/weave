import { paintCycle } from '@roenlie/core/async';
import { css, LitElement, render } from 'lit';
import { customElement } from 'lit/decorators.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';
import { IAlertDefinition } from './alert-setup-api.js';

import('./alert.cmp.js');


@customElement('pl-alert-portal')
export class AlertPortalCmp extends LitElement {

	public async display(definition: IAlertDefinition) {
		const { properties, template } = definition;

		const alert = Object.assign(document.createElement('pl-alert'), {
			variant:  properties.variant ?? 'primary',
			closable: properties.closeable ?? true,
			duration: properties.duration ?? 5000,
		});

		render(template(alert), alert);
		paintCycle().then(async () => alert.toast());
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			position: content;
			position: fixed;
			top: 0;
			inset-inline-end: 0;
			z-index: var(--index-toast);
			width: 28rem;
			max-width: 100%;
			max-height: 100%;
			overflow: auto;
		}
		pl-alert {
			--box-shadow: var(--box-shadow-m);
			margin: var(--spacing-m);
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-alert-portal': AlertPortalCmp;
	}
}


export const alertPortal: AlertPortalCmp = Object.assign(document.createElement('pl-alert-portal'));
