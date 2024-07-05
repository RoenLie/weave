import { faker } from '@faker-js/faker';
import { range } from '@roenlie/core/array';
import { type Column, FragmentTable, type Options } from '@roenlie/elements/fragment-table';
import { MMTypeahead } from '@roenlie/elements/typeahead';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html, LitElement } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

FragmentTable.register();
MMTypeahead.register();


interface Data {
	id:        ReturnType<typeof faker.database.mongodbObjectId>,
	firstName: ReturnType<typeof faker.person.firstName>,
	lastName:  ReturnType<typeof faker.person.lastName>,
	email:     ReturnType<typeof faker.internet.email>,
	street:    ReturnType<typeof faker.location.street>,
	country:   ReturnType<typeof faker.location.country>,
	city:      ReturnType<typeof faker.location.city>,
	IBAN:      ReturnType<typeof faker.finance.iban>,
}


@customElement('mm-fragment-table-demo')
export class FragmentTableDemo extends LitElement {

	@query('mm-fragment-table') protected tableEl: FragmentTable;

	protected columns: Column<Data>[] = [
		{
			label:        'ID',
			field:        'id',
			minWidth:     150,
			defaultWidth: 250,
		},
		{
			label:        'First name',
			field:        'firstName',
			minWidth:     150,
			defaultWidth: 250,
			fieldEditor:  () => {
				return html`
				<mm-typeahead
					openOnFocus
					openOnClick
					openImmediately
					immediateFocus
					style="z-index:1;"
					@close=${ () => {
						this.tableEl.toggleEditor();
					} }
				>
					${ map(range(200), () => html`
					<mm-typeahead-item>
						Stuff
					</mm-typeahead-item>
					`) }
				</mm-typeahead>
				`;
			},
		},
		{
			label:        'Last name',
			field:        'lastName',
			minWidth:     150,
			defaultWidth: 250,
		},
		{
			label:        'Email',
			field:        'email',
			minWidth:     150,
			defaultWidth: 250,
		},
		{
			label:        'Street',
			field:        'street',
			minWidth:     150,
			defaultWidth: 250,
		},
		{
			label:        'Country',
			field:        'country',
			minWidth:     150,
			defaultWidth: 250,
		},
		{
			label:        'City',
			field:        'city',
			minWidth:     150,
			defaultWidth: 250,
		},
		{
			label:        'IBAN',
			field:        'IBAN',
			minWidth:     150,
			defaultWidth: 250,
		},
	];

	protected data: Data[] = range(1000).map(() => ({
		id:        faker.database.mongodbObjectId(),
		firstName: faker.person.firstName(),
		lastName:  faker.person.lastName(),
		email:     faker.internet.email(),
		street:    faker.location.street(),
		country:   faker.location.country(),
		city:      faker.location.city(),
		IBAN:      faker.finance.iban(),
	}));

	protected options: Options = {
		checkbox: true,
	};

	protected override render() {
		return html`
		<mm-fragment-table
			.data   =${ this.data }
			.columns=${ this.columns }
			.options=${ this.options }
			@header-click=${ (ev: CustomEvent<HTMLTableRowElement>) => {
				//console.log(ev.type, ev.detail);
			} }
			@row-click=${ (ev: CustomEvent<HTMLTableRowElement>) => {
				//console.log(ev.type, ev.detail);
			} }
			@cell-click=${ (ev: CustomEvent<HTMLTableCellElement>) => {
				//console.log(ev.type, ev.detail);
			} }
			@row-check=${ (ev: CustomEvent<HTMLInputElement>) => {
				//console.log(ev.type, ev.detail);
			} }
			@row-check-all=${ (ev: CustomEvent<HTMLInputElement>) => {
				//console.log(ev.type, ev.detail);
			} }
			@cell-dbl-click=${ (ev: CustomEvent<HTMLTableCellElement>) => {
				const td = ev.detail;
				const row = td.dataset['row']!;
				const cell = td.dataset['cell']!;

				this.tableEl.toggleEditor(row, cell);

				const abortCtrl = new AbortController();
				window.addEventListener('mousedown', (e) => {
					const path = e.composedPath();
					const pathHasSameTd = path.some(el => {
						if (!(el instanceof HTMLTableCellElement))
							return;

						return row === el.dataset['row']
							&& cell === el.dataset['cell'];
					});

					if (!pathHasSameTd) {
						this.tableEl.toggleEditor();
						abortCtrl.abort();
					}
				}, { signal: abortCtrl.signal });
			} }
		></mm-fragment-table>
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			display: grid;
			overflow: auto;
			margin: 24px;
		}
		mm-fragment-table {
			--header-color:        var(--on-background);
			--header-background:   var(--shadow1);
			--header-bottom-border:2px solid var(--background-strong);
			--row-even-background: var(--surface1);
			--row-bottom-border:   2px solid var(--background-strong);
			--row-background-hover:var(--shadow1);
			--table-color:         var(--on-background);
			--table-background:    var(--surface);
			--table-bottom-border: 2px solid var(--shadow1);

			height: 500px;
		}
		`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'mm-fragment-table-demo': FragmentTableDemo;
	}
}
