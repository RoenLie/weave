import { html } from 'lit';

import { alertPortal } from '../../components/alert/alert-portal.cmp.js';
import { Alerts } from '../../components/alert/alert-setup-api.js';


export const confirmAlert = (message: string, handleConfirm?: () => Promise<void> | void) => {
	Alerts.define({
		closeable: false,
		duration:  Infinity,
		variant:   'primary',
	}).template((alert) => {
		return html`
		<pl-boot-icon slot="icon" icon="exclamation-octagon"></pl-boot-icon>
		<pl-text>${ message }</pl-text>
		<pl-button @click=${ async () => {
			await handleConfirm?.();
			alert.hide();
		} }>
			CONFIRM
		</pl-button>
		`;
	}).displayTo(alertPortal);
};
