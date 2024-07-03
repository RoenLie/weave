import { EventOf } from '@roenlie/core/dom';
import { html } from 'lit';

import { Dialogs } from '../../components/dialog/dialog-setup-api.js';
import { dialogPortal } from '../../components/dialog/templates/dialog-portal.cmp.js';


const promptDialogDefinition = Dialogs.define<string>({
	resizable:     false,
	cancellable:   false,
	moveable:      false,
	displaceable:  false,
	maximizable:   false,
	modal:         true,
	fullscreen:    false,
	initialXY:     [ NaN, NaN ],
	initialHeight: '150px',
	initialWidth:  '300px',
}).controller(() => ({
	prompt: '',
})).template(ctrl => html`
<style>
	.base {
		display: grid;
		place-items: center;
	}
	.actions {
		display: flex;
		justify-content: space-around;
		width: 100%;
	}
	pl-input {
		width: 100%;
	}
</style>
<div class="base">
	<pl-text type="body-medium">Confirm?</pl-text>
	<pl-input
		label="Optional message"
		auto-focus
		@input=${ (ev: EventOf<HTMLInputElement>) => ctrl.prompt = ev.target.value }
	></pl-input>
	<div class="actions">
		<pl-button @click=${ () => ctrl.close(ctrl.prompt) }>Submit</pl-button>
		<pl-button @click=${ () => ctrl.close(undefined) }>Cancel</pl-button>
	</div>
</div>
`);


export const promptDialog = () => {
	return promptDialogDefinition.displayTo(dialogPortal).result;
};
