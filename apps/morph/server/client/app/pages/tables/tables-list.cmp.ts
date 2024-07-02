import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { TablesStore } from './tables-store.ts';


interface TableEntry {
	name: string;
	exists: () => boolean;
	demoData?: boolean;
}


const tableExists = (_name: string) => false;


@customElement('m-tables-list')
export class TablesList extends LitElement {

	@property({ type: Object }) public store: TablesStore;

	protected listOfTables: TableEntry[] = [
		{
			name:     'users',
			exists:   () => tableExists('users'),
			demoData: true,
		},
		{
			name:     'modules',
			exists:   () => tableExists('modules'),
			demoData: true,
		},
		{
			name:   'OTP',
			exists: () => tableExists('OTP'),
		},
	];

	protected override render() {
		return html`
		<ul>
		${ this.listOfTables.map(table => {
			return html`
			<li>
				<button>
					${ table.name }
				</button>

				${ !table.exists() ? html`
				<button
					void-get="/tables/create/${ table.name }"
					void-target="tables-list"
				>
					Create
				</button>
				` : '' }
				${ table.exists() ? html`
				${ table.demoData ? html`
				<button
					void-get="/tables/demo/${ table.name }"
					void-target="tables-list,tables-contents"
					void-confirm="Confirm adding demo data to table: ${ table.name }"
				>
					Add demo data
				</button>
				` : '' }
				<button
					void-get="/tables/drop/${ table.name }"
					void-target="tables-list,tables-contents"
					void-confirm="Confirm deleting table: ${ table.name }"
				>Drop</button>
				` : '' }
			</li>
			`;
		}) }
		</ul>
		`;
	}

	public static override styles = css`
	:host {
		overflow: hidden;
		display: grid;
	}
	ul,li {
		all: unset;
	}
	ul {
		display: grid;
		grid-auto-rows: max-content;
		gap: 8px;
	}
	ul li {
		display: grid;
		grid-template-columns: 1fr;
		grid-auto-flow: column;
		grid-auto-columns: max-content;
		padding-block: 4px;
		padding-inline: 8px;
		background-color: rgb(20 20 20 / 20%);
	}
	`;

}
