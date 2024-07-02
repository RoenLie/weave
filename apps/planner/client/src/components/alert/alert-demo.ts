import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

import { confirmAlert } from '../../features/alerts/confirm-alert.js';
import { alertPortal } from './alert-portal.cmp.js';
import { Alerts } from './alert-setup-api.js';


@customElement('pl-alert-demo')
export class AlertDemo extends LitElement {

	//#region properties
	//#endregion


	//#region lifecycle
	//#endregion


	//#region logic
	//#endregion


	protected alertDef = Alerts.define({
		variant:   'primary',
		duration:  Infinity,
		closeable: true,
	}).template(() => html`
		<pl-boot-icon slot="icon" icon="info-circle"></pl-boot-icon>
		<strong>This is super informative</strong><br />
		You can tell by how pretty the alert is.
	`);


	//#region template
	public override render() {
		return html`
		<pl-button
			variant="primary"
			@click=${ () => this.alertDef.displayTo(alertPortal) }
		>
			Toast!
		</pl-button>
		<pl-button
			variant="primary"
			@click=${ () => confirmAlert('CONFIRM THIS!', () => console.log('confirming')) }
		>
			Confirm!
		</pl-button>


		<div class="variants">
			${ map([ 'primary', 'success', 'neutral', 'warning', 'error' ], variant => html`
			<div class="variant">
				<pl-text>${ variant }</pl-text>
				<pl-alert open variant=${ variant }>
					<pl-boot-icon slot="icon" icon="info-circle"></pl-boot-icon>
					<strong>This is super informative</strong><br />
					You can tell by how pretty the alert is.
				</pl-alert>
			</div>
			`) }
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		css`
		.variants {
			display: grid;
			place-items: center;
			gap: var(--spacing-m);
		}
		.variant {
			display: grid;
			grid-template-columns: 1fr 2fr;
			place-items: center;
		}
		`,
	];
	//#endregion


}
