import { range } from '@roenlie/core/array';
import { domId } from '@roenlie/core/dom';
import { type ListTemplateConfig, MMTemplateList } from '@roenlie/elements/template-list';
import { css, html, LitElement, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

MMTemplateList.register();


export interface User {
	id: string;
	username: string;
	email: string;
	firstname: string;
	middlename: string;
	lastname: string;
	title: string;
	shift: string;
	department: string;
	company: string;
}

export const newUserEntity = (): User => {
	return {
		id:         domId(),
		firstname:  domId(),
		middlename: domId(),
		lastname:   domId(),
		department: domId(),
		company:    domId(),
		username:   domId(),
		email:      domId(),
		title:      domId(),
		shift:      domId(),
	};
};


@customElement('mm-template-list-demo')
export class TemplateListDemo extends LitElement {

	protected items: User[] = range(0, 5000).map(newUserEntity);

	protected templates: ListTemplateConfig<User> = {
		header: (template: TemplateResult | unknown) => html`
		<mm-header>
			${ template }
		</mm-header>
		`,
		headerField: Object.entries(this.items[0]!).map(([ key, value ]) => () => html`
		<mm-field style="width: 100px">
			${ key }
		</mm-field>
		`),
		row: (row, template: TemplateResult | unknown) => html`
		<mm-row .item=${ row }>
			${ template }
		</mm-row>
		`,
		rowField: Object.entries(this.items[0]!).map(([ key, value ]) => (rowData) => html`
		<mm-field style="width: 100px">
			${ key }
		</mm-field>
		`),
	};

	public override connectedCallback(): void {
		super.connectedCallback();
	}

	public override render() {
		return html`
		<mm-template-list
			.items=${ this.items }
			.templates=${ this.templates }
		></mm-template-list>
		`;
	}

	public static override styles = [
		css`
		:host {
			display: flex;
			height: 450px;
			border: 2px solid var(--outline-variant);
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'mm-list-demo': TemplateListDemo;
	}
}
