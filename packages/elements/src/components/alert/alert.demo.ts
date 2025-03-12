import { alertPortal, MMAlert, MMAlertPortal } from './index.ts';
import { Alerts, type IAlertProps } from './index.ts';
import { MMButton } from '../button/button.cmp.ts';
import { MMIcon } from '../icon/icon-element.ts';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { map } from 'lit/directives/map.js';


@customElement('mm-alert-demo')
export class DemoAlert extends LitElement {

	static {
		MMIcon.register();
		MMButton.register();
		MMAlert.register();
		MMAlertPortal.register();
	}

	//#region properties
	//#endregion


	//#region lifecycle
	//#endregion


	//#region logic
	//#endregion


	protected alertDef = Alerts.define({
		variant:   'primary',
		duration:  1000,
		closeable: true,
	}).template(() => html`
		<mm-icon
			slot="icon"
			url="https://icons.getbootstrap.com/assets/icons/info-circle.svg"
		></mm-icon>
		<strong>This is super informative</strong><br />
		You can tell by how pretty the alert is.
	`);


	//#region template
	public override render() {
		return html`
		<mm-button
			variant="primary"
			@click=${ () => this.alertDef.displayTo(alertPortal) }
		>
			Toast!
		</mm-button>
		<mm-button
			variant="primary"
			@click=${ () => confirmAlert('CONFIRM THIS!', () => console.log('confirming')) }
		>
			Confirm!
		</mm-button>

		<div class="variants">
			${ map([ 'primary', 'success', 'neutral', 'warning', 'error' ], (variant: IAlertProps['variant']) => html`
			<div class="variant">
				<span>${ variant }</span>
				<mm-alert open variant=${ ifDefined(variant) }>
					<mm-icon slot="icon" url="https://icons.getbootstrap.com/assets/icons/info-circle.svg"></mm-icon>
					<strong>This is super informative</strong><br />
					You can tell by how pretty the alert is.
				</mm-alert>
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


export const confirmAlert = (message: string, handleConfirm?: () => Promise<void> | void) => {
	Alerts.define({
		closeable: false,
		duration:  Infinity,
		variant:   'primary',
	}).template((alert) => {
		return html`
		<mm-icon slot="icon" url="https://icons.getbootstrap.com/assets/icons/exclamation-octagon.svg"></mm-icon>
		<span>${ message }</span>
		<mm-button @click=${ async () => {
			await handleConfirm?.();
			alert.hide();
		} }>
			CONFIRM
		</mm-button>
		`;
	}).displayTo(alertPortal);
};


console.log('kake');
