import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, render } from 'lit';

import { MMAlert } from './alert.cmp.js';
import { type IAlertDefinition } from './alert-setup-api.js';


declare global {
	interface HTMLElementTagNameMap {
		'mm-alert-portal': MMAlertPortal;
	}
}


@customElement('mm-alert-portal')
export class MMAlertPortal extends MimicElement {

	public display(definition: IAlertDefinition) {
		const { properties, template } = definition;

		MMAlert.register();
		globalThis.customElements.whenDefined(MMAlert.tagName).then(() => {
			const alertEl = document.createElement(MMAlert.tagName) as MMAlert;
			const alert = Object.assign(alertEl, {
				variant:  properties.variant ?? 'primary',
				closable: properties.closeable ?? true,
				duration: properties.duration ?? 5000,
			});

			render(template(alert), alert);
			setTimeout(() => alert.toast());
		});
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			--_alert-index: var(--mm-alert-index, 950);
		}
		`,
		css`
		:host {
			position: fixed;
			top: 0;
			right: 0;
			z-index: var(--_alert-index);
			width: 28rem;
			max-width: 100dvw;
			max-height: 100dvh;
			overflow: auto;

			display: flex;
			flex-flow: column nowrap;
			gap: 6px;
		}
	`,
	];

}

MMAlertPortal.register();


export const alertPortal = document.createElement(MMAlertPortal.tagName) as MMAlertPortal;
