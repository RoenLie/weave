import { EventOf } from '@roenlie/core/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { InputCmp } from '../input/input.cmp.js';


export interface ConfigFormField {
	path: string;
	label: string;
	value?: string | number;
	placeholder?: string;
}


@customElement('pl-form')
export class FormCmp extends LitElement {

	//#region properties
	@property({ type: Array, attribute: false }) public fields?: ConfigFormField[];
	//#endregion


	//#region lifecycle
	//#endregion


	//#region logic
	//#endregion


	//#region template
	public override render() {
		return html`
		${ repeat(this.fields ?? [], field => field, (field, i) => html`
		<pl-input
			shape="sharp"
			.label=${ field.label ?? '' }
			.value=${ String(field.value ?? '') }
			.placeholder=${ field.placeholder ?? '' }
			@input=${ (ev: EventOf<InputCmp>) => this.fields![i]!.value = ev.target.value }
		></pl-input>
		`) }
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		css`
		:host {
			display: grid;
			grid-template-columns: 1fr 1fr;
			grid-auto-rows: min-content;
			gap: var(--spacing-xl);
		}
		pl-input {
			display: block;
		}
	`,
	];
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-form': FormCmp;
	}
}
