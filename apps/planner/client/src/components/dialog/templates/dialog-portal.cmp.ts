import { animateTo, getAnimation, stopAnimations } from '@roenlie/core/animation';
import { Hooks } from '@roenlie/core/coms';
import { RecordOf } from '@roenlie/core/types';
import { EventController, KeyboardController, LocalizeController } from '@roenlie/lit-utilities/controllers';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';

import { DialogHooks, IDialogDef, IDialogPortal, IDialogPortalCtrl, IDialogProps } from '../dialog.types.js';
import { DialogInstance } from '../dialog-instance.js';


export const dialogPortal: DialogPortalCmp = Object.assign(document.createElement('pl-dialog-portal'));
document.body.append(dialogPortal);


@customElement('pl-dialog-portal')
export class DialogPortalCmp extends LitElement implements IDialogPortal {

	//#region properties
	public readonly hooks = new Hooks<DialogHooks>();

	protected controlFocus = false;

	/** The currently displayed instances. */
	protected readonly instances = new Map<string, DialogInstance>();

	protected readonly localize = new LocalizeController({ host: this });
	//#endregion properties


	//#region logic
	public get<
		TResult = any,
		TCtrl extends RecordOf = RecordOf
	>(id: string): DialogInstance<TResult, TCtrl> | undefined {
		return this.instances.get(id);
	}

	public display< TResult, TCtrl extends RecordOf = RecordOf>(
		definition: IDialogDef<TResult, TCtrl>,
		overrides?: IDialogProps,
		parent?: DialogInstance,
	): DialogInstance<TResult> {
		const { properties } = definition;

		let instance: DialogInstance<TResult>;

		const controller: IDialogPortalCtrl =  {
			localize: this.localize,
			display:  <TChildResult, TChildCtrl extends RecordOf = RecordOf>(
				def: IDialogDef<TChildResult, TChildCtrl>, ovr?: IDialogProps,
			) => {
				return this.display(def, ovr, instance);
			},
		};

		// When the definition has an id we must close any existing instance with the same id
		if (properties.id)
			this.instances.get(properties.id)?.close();

		instance = new DialogInstance<TResult>({
			definition,
			controller,
			overrides,
			parent,
			closeEffect: () => dialogCloseAnimation(this, instance.id),
		});

		instance.result.then(result => this.onClose(instance, result));
		instance.closed.finally(() => this.onClosed(instance));

		this.onOpen(instance);

		return instance;
	}

	protected onOpen<TResult>(instance: DialogInstance<TResult>) {
		this.hooks.trigger('open', instance);

		this.instances.set(instance.id, instance);
		this.requestUpdate();
	}

	protected onClose<TResult>(instance: DialogInstance<TResult>, result?: TResult) {
		this.hooks.trigger('close', instance, result);
	}

	protected onClosed(instance: DialogInstance) {
		this.hooks.trigger('closed', instance);

		this.instances.delete(instance.id);
		this.requestUpdate();
	}
	//#endregion logic


	//#region controllers
	protected eventCtrl = new EventController({
		host:      this,
		listeners: [
			{ target: this, type: 'focusin', listener: () => this.controlFocus = true },
			{ target: this, type: 'focusout', listener: () => this.controlFocus = false },
		],
	});

	protected keyboardCtrl = new KeyboardController({
		host:      this,
		target:    window,
		eventType: 'keydown',
		keylist:   [
			{ key: '1', modifiers: [ [ 'alt' ] ] },
			{ key: '2', modifiers: [ [ 'alt' ] ] },
			{ key: '3', modifiers: [ [ 'alt' ] ] },
			{ key: '4', modifiers: [ [ 'alt' ] ] },
			{ key: '5', modifiers: [ [ 'alt' ] ] },
			{ key: '6', modifiers: [ [ 'alt' ] ] },
			{ key: '7', modifiers: [ [ 'alt' ] ] },
			{ key: '8', modifiers: [ [ 'alt' ] ] },
			{ key: '9', modifiers: [ [ 'alt' ] ] },
			{ key: '0', modifiers: [ [ 'alt' ] ] },
		],
		listener: (ev) => {
			if (!this.controlFocus)
				return;

			let dialogNr = Number(ev.key);
			dialogNr  = dialogNr > 0 ? dialogNr - 1 : dialogNr;

			const ids = Array.from(this.instances.keys());

			const id = ids[dialogNr];
			if (id) {
				const el = this.renderRoot.querySelector<HTMLElement>('#' + id);
				el?.focus();
			}
		},
	});
	//#endregion controllers

	//#region template
	protected renderDialog = (instance: DialogInstance) => {
		const { id, properties, render } = instance;

		const isModal = !!(properties?.modal);
		const type = isModal ? 'modal' : 'dialog';

		const template = html`
		<pl-dialog-background id="bg-${ id }" type=${ type }>
			<pl-dialog
				id             =${ id }
				name           =${ ifDefined(properties.name) }
				initialWidth   =${ ifDefined(properties.initialWidth) }
				initialHeight  =${ ifDefined(properties.initialHeight) }
				?moveable      =${ properties.moveable ?? true }
				?resizable     =${ properties.resizable ?? true }
				?maximizable   =${ properties.maximizable ?? false }
				?displaceable  =${ properties.displaceable ?? true }
				?cancellable   =${ properties.cancellable ?? true }
				.initialXY     =${ properties.initialXY }
				.constraints   =${ properties.constraints }
				.renderFn      =${ render }
				.closeFn       =${ () => instance.close() }
				.portal        =${ this }
			></pl-dialog>
		</pl-dialog-background>
		`;

		return template;
	};

	protected override render() {
		return repeat(this.instances.values(), inst => inst.id, inst => this.renderDialog(inst));
	}
	//#endregion template


	//#region style
	public static override styles = [
		css`
		:host {
			display: contents;
		}
	`,
	];
	//#endregion style

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-dialog-portal': DialogPortalCmp;
	}
}


const dialogCloseAnimation = async (portal: Element, id: string) => {
	const bgRef = portal.shadowRoot?.getElementById('bg-' + id);
	if (!bgRef)
		return;

	await stopAnimations(bgRef);
	const { keyframes, options } = getAnimation(bgRef, 'dialog.hide');
	await animateTo(bgRef, keyframes, options);
	bgRef.hidden = false;
};
