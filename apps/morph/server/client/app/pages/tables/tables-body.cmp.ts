import './tables-list.cmp.ts';
import './tables-contents.cmp.ts';

import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { TablesStore } from './tables-store.ts';


@customElement('m-tables-body')
export class TablesBody extends LitElement {

	protected store = new TablesStore();

	public override connectedCallback(): void {
		super.connectedCallback();
	}

	protected override render() {
		return html`
		<aside>
			<m-tables-list
				.store=${ this.store }
			></m-tables-list>
		</aside>
		<main>
			<m-tables-contents
				.store=${ this.store }
			></m-tables-contents>
		</main>
		`;
	}

	public static override styles = css`
	:host {
		overflow: hidden;
		display: grid;
		grid-template-columns: max-content 1fr;
		grid-template-rows: 1fr;
		grid-auto-rows: 0px;
	}
	aside {
		overflow: hidden;
		background-color: teal;
		display: grid;
		grid-template-rows: max-content 1fr;
	}
	main {
		overflow: hidden;
		display: grid;
		grid-template-rows: 1fr;

		& > * {
			grid-row: 1/2;
			grid-column: 1/2;
		}
	}
	`;

}
