import { faker } from '@faker-js/faker';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


interface User {
	userId:       string;
	username:     string;
	email:        string;
	avatar:       string;
	password:     string;
	birthdate:    Date;
	registeredAt: Date;
}


export const createRandomUser = (): User => {
	return {
		userId:       faker.datatype.uuid(),
		username:     faker.internet.userName(),
		email:        faker.internet.email(),
		avatar:       faker.image.avatar(),
		password:     faker.internet.password(),
		birthdate:    faker.date.birthdate(),
		registeredAt: faker.date.past(),
	};
};


export const USERS: User[] = [];


Array.from({ length: 10 }).forEach(() => {
	USERS.push(createRandomUser());
});


@customElement('pl-list')
export class ListCmp extends LitElement {

	public override render() {
		return html`
		<div class="base">
			${ map(USERS, user => html`
				<span class="user">
					<span>${ user.username }</span>
					<span>${ user.email }</span>
					<span>${ user.password }</span>
				</span>
			`) }
		</div>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			display: grid;
			overflow: hidden;
		}
		.base {
			display: grid;
			gap: 12px;
			overflow: auto;
		}
		.user {
			display: flex;
			flex-flow: column nowrap;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-list': ListCmp;
	}
}
