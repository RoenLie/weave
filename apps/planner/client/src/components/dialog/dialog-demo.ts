import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { DialogInstance } from './dialog-instance.js';
import { Dialogs } from './dialog-setup-api.js';
import type { DialogPortalCmp } from './templates/dialog-portal.cmp.js';


@customElement('pl-dialog-demo')
export class DialogDemo extends LitElement {

	//#region properties
	@property() public example: keyof DialogDemo['examples'];
	protected examples = {
		basic: () => {
			const def = Dialogs.define({
				initialHeight:  '100px',
				initialWidth:   '200px',
				cascadeRemoval: true,
				maximizable:    true,
				modal:          true,
			}).template(() => {
				return html`
				<div>Empty dialog</div>
				`;
			});

			return html`
			<pl-component-preview>
				<div slot="example">
					<pl-button @click=${ () => this.portal.display(def) }>
						Open Empty Dialog
					</pl-button>
				</div>
			</pl-component-preview>
			`;
		},
		forms: () => {
			const offset = 24;
			let count = 0;
			const def = Dialogs.define({
				name:           'outer',
				initialXY:      [ NaN, 100 ],
				initialHeight:  '140px',
				initialWidth:   '200px',
				cascadeRemoval: true,
				maximizable:    true,
				modal:          true,
				moveable:       false,
				resizable:      false,
			}).controller(({ hooks, display }) => {
				hooks.add('open', (instance: DialogInstance) => console.log('demo:dialog:hooks:instance:open', instance));
				hooks.add('close', (instance: DialogInstance, result: any) => console.log('demo:dialog:hooks:instance:close', instance, result));
				hooks.add('closed', (instance: DialogInstance) => console.log('demo:dialog:hooks:instance:closed', instance, count));

				const personDialog = Dialogs
					.define<{ val: string }>({
						name:          'person',
						initialXY:     [ 100, 260 ],
						initialHeight: 'auto',
						resizable:     false,
					})
					.template(({ close }) => {
						return html`
						<div style="display:grid; gap:12px;">
							<h3>Enter your personalia</h3>
							<pl-input label="first name"></pl-input>
							<pl-input label="last name"></pl-input>
							<pl-input label="email" type="email"></pl-input>
							<pl-button @click=${ () => close({ val: "It's here!" }) }>
								Submit
							</pl-button>
						</div>
						`;
					});
				const addressDialog = Dialogs
					.define({
						name:          'address',
						initialXY:     [ 150, 310 ],
						initialHeight: 'auto',
						resizable:     true,
					})
					.template(() => {
						return html`
						<div style="display:grid; gap:12px;">
							<h3>Enter your address</h3>
							<pl-input label="address"></pl-input>
							<pl-input label="postal code"></pl-input>
						</div>
						`;
					});

				return {
					// A controller extension which calls the ctrl.display internally and
					// provides a property override for the initial placement.
					promptForPerson: async () => {
						const [ x, y ] = personDialog.properties.initialXY! as [x: number, y: number];
						const displacement = count++ * offset;
						const result = await display(personDialog, {
							initialXY: [ x + displacement, y + displacement ],
						}).result;
						console.log('¤ demo:dialog', 'Form dialog: result =', result?.val);
					},
					addressDialog,
				};
			}).template(({ promptForPerson, addressDialog, display }) => {
				return html`
				<div style="display: grid; gap:12px;">
					<pl-button @click=${ () => promptForPerson() }>
						Person dialog
					</pl-button>
					<pl-button @click=${ () => display(addressDialog) }>
						Address dialog
					</pl-button>
				</div>
				`;
			});

			return html`
			<pl-component-preview>
				<div slot="example">
					<pl-button @click=${ () => this.portal.display(def) }>
						Open Dialog with forms
					</pl-button>
				</div>
			</pl-component-preview>
			`;
		},
		nested: () => {
			const def = Dialogs.define({
				initialHeight:  '140px',
				initialWidth:   '240px',
				cascadeRemoval: true,
				maximizable:    false,
				modal:          false,
			}).template(({ display, instance }) => {
				return html`
				<h1>${ instance.id }</h1>
				<pl-button @click=${ () => display(def) }>
					Open
				</pl-button>
				`;
			});

			return html`
			<pl-component-preview>
				<div slot="example">
					<pl-button @click=${ () => this.portal.display(def) }>
						Open nested dialogs
					</pl-button>
				</div>
			</pl-component-preview>
			`;
		},
	};

	@query('pl-dialog-portal') protected portal: DialogPortalCmp;
	//#endregion properties


	//#region logic
	//#endregion logic


	//#region controllers
	//#endregion controllers


	//#region lifecycle
	public override async connectedCallback() {
		super.connectedCallback();
		await this.updateComplete;

		this.portal.hooks.add('open', (instance: DialogInstance) => console.log('dialog opened', instance));
		this.portal.hooks.add('close', (instance: DialogInstance, count: number) => console.log('dialog closed', instance, count));
	}
	//#endregion lifecycle


	//#region template
	public override render() {
		return html`
		<pl-dialog-portal></pl-dialog-portal>
		${ this.examples[this.example]?.() }
		${ this.examples.basic() }
		${ this.examples.forms() }
		${ this.examples.nested() }
		`;
	}
	//#endregion template


	//#region style
	public static override styles = [
		css`
		`,
	];
	//#endregion style

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-dialog-demo': DialogDemo;
	}
}
