import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { TablesStore } from './tables-store.ts';


@customElement('m-tables-contents')
export class TablesContents extends LitElement {

	@property({ type: Object }) public store: TablesStore;

	protected override render() {
		if (!this.store.name)
			return nothing;

		return html`
		<h1>${ this.store.name.value }</h1>
		<monaco-editor
			language="json"
			.value=${ JSON.stringify(this.store.items.value, null, '\t') }
		></monaco-editor>
		`;
	}

	public static override styles = css`
	:host {
		overflow: hidden;
		display: grid;
		grid-template-rows: max-content 1fr;
	}
	h1 {
		all: unset;
		font-size: 1.5em;
		position: sticky;
		top: 0px;
		background-color: rgb(30, 30, 30);
		padding-top: 24px;
		padding-bottom: 8px;
		padding-inline: 24px;
		border-bottom: 2px solid white;
	}
	`;

}
