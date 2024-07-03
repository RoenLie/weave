import { animateTo, getAnimation, setDefaultAnimation, stopAnimations } from '@roenlie/core/animation';
import { watch } from '@roenlie/lit-utilities/decorators';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { componentStyles } from '../../../features/shared-styles/component-styles.js';


@customElement('pl-dialog-background')
export class DialogBackgroundCmp extends LitElement {

	//#region state
	@property({ type: String }) public type: 'modal' | 'dialog' = 'dialog';
	//#endregion state


	//#region properties
	//#endregion properties


	//#region logic
	@watch('type')
	protected onType() {
		this.classList.remove('modal', 'dialog');
		this.classList.add(this.type);
	}
	//#endregion logic


	//#region controllers
	//#endregion controllers


	//#region lifecycle
	public override connectedCallback() {
		super.connectedCallback();
		this.hidden = true;

		this.updateComplete.then(async () => {
			this.hidden = false;
			await stopAnimations(this);
			const { keyframes, options } = getAnimation(this, 'dialog.show');
			await animateTo(this, keyframes, options);
		});
	}
	//#endregion lifecycle


	//#region template
	public override render() {
		return html`
		<slot></slot>
		`;
	}
	//#endregion template


	//#region style
	public static override styles = [
		componentStyles,
		css`
		:host {
			position: fixed;
			z-index: var(--index-dialog);
		}
		:host(.modal) {
			inset: 0;
			background-color: var(--transparent-1);
		}
	`,
	];
	//#endregion style

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-dialog-background': DialogBackgroundCmp;
	}
}


setDefaultAnimation('dialog.show', {
	keyframes: [
		{ opacity: 0 },
		{ opacity: 1 },
	],
	options: { duration: 300, easing: 'ease' },
});

setDefaultAnimation('dialog.hide', {
	keyframes: [
		{ opacity: 1 },
		{ opacity: 0 },
	],
	options: { duration: 300, easing: 'ease' },
});
