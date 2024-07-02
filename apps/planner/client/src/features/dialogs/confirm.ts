import { html } from 'lit';

import { Dialogs } from '../../components/dialog/dialog-setup-api.js';
import { dialogPortal } from '../../components/dialog/templates/dialog-portal.cmp.js';


export const confirmDialog = (message: string) => {
	return Dialogs.define<boolean>({
		resizable:     false,
		cancellable:   false,
		moveable:      false,
		displaceable:  false,
		maximizable:   false,
		modal:         true,
		fullscreen:    false,
		initialHeight: '150px',
		initialWidth:  '300px',
	}).controller(() => ({})).template(ctrl => html`
	<style>
		.base {
			display: grid;
			place-items: center;
		}
		pl-text {
			text-align: center;
		}
		.actions {
			display: flex;
			justify-content: space-around;
			width: 100%;
		}
	</style>
	<div class="base">
		<pl-text type="body-large">${ message }</pl-text>
		<div class="actions">
			<pl-button variant="text" @click=${ () => ctrl.close(false) }>No</pl-button>
			<pl-button variant="elevated" @click=${ () => ctrl.close(true) }>Yes</pl-button>
		</div>
	</div>
	`).displayTo(dialogPortal).result;
};
