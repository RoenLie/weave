import { User } from '@rotul/planner-entities';
import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('pl-list-demo')
export class ListDemoCmp extends LitElement {

	public override connectedCallback(): void {
		super.connectedCallback();
	}

	protected rowTemplate(fieldTemplate: TemplateResult | unknown) {
		return html`
		<pl-row>
			${ fieldTemplate }
		</pl-row>
		`;
	}

	protected fieldTemplates = [
		(rowData: User) => html`
		<pl-field style="width: 100px;">${ rowData.firstname }</pl-field>
		`,
		(rowData: User) => html`
		<pl-field style="width: 100px;">${ rowData.department }</pl-field>
		`,
		(rowData: User) => html`
		<pl-field style="width: 100px;">${ rowData.company }</pl-field>
		`,
		(rowData: User) => html`
		<pl-field style="width: 100px;">${ rowData.firstname }</pl-field>
		`,
		(rowData: User) => html`
		<pl-field style="width: 100px;">${ rowData.department }</pl-field>
		`,
		(rowData: User) => html`
		<pl-field style="width: 100px;">${ rowData.company }</pl-field>
		`,
		(rowData: User) => html`
		<pl-field style="width: 100px;">${ rowData.firstname }</pl-field>
		`,
		(rowData: User) => html`
		<pl-field style="width: 100px;">${ rowData.department }</pl-field>
		`,
		(rowData: User) => html`
		<pl-field style="width: 100px;">${ rowData.company }</pl-field>
		`,
	];

	public override render() {
		return html`
		<pl-template-list
			.items=${ [] }
			.rowTemplate=${ this.rowTemplate }
			.fieldTemplates=${ this.fieldTemplates }
		></pl-template-list>
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
		'pl-list-demo': ListDemoCmp;
	}
}
