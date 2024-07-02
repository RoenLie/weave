import { html } from 'lit';

import { alertPortal } from '../../components/alert/alert-portal.cmp.js';
import { Alerts, IAlertProps } from '../../components/alert/alert-setup-api.js';


export const basicAlert = (message: string, variant: IAlertProps['variant'], duration = 3000) => {
	Alerts.define({ duration, variant, closeable: true }).template(() => {
		return html`
		<pl-boot-icon slot="icon" icon="exclamation-octagon"></pl-boot-icon>
		<pl-text>${ message }</pl-text>
		`;
	}).displayTo(alertPortal);
};
