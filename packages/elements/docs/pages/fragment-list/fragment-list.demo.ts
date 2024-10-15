import { faker } from '@faker-js/faker';
import { range } from '@roenlie/core/array';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { DemoFragmentList } from '../../../src/components/fragment-list/fragment-list.ts';

DemoFragmentList;


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


@customElement('mm-fragment-list-demo')
export class FragmentListDemo extends LitElement {

	protected data: Data[] = range(4000).map(() => ({
		id:        faker.database.mongodbObjectId(),
		firstName: faker.person.firstName(),
		lastName:  faker.person.lastName(),
		email:     faker.internet.email(),
		street:    faker.location.street(),
		country:   faker.location.country(),
		city:      faker.location.city(),
		IBAN:      faker.finance.iban(),
	}));

	protected override render() {
		return html`
		<mm-fragment-list
			.data   =${ this.data }
		></mm-fragment-list>
		`;
	}

	public static override styles = [
		//sharedStyles,
		css`
		:host {
			display: grid;
			overflow: auto;
			margin: 24px;
		}
		mm-fragment-list {
			border: 2px solid rebeccapurple;
			height: 500px;
		}
		`,
	];

}
