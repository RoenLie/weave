import { AdapterElement, customElement } from '@roenlie/custom-element/adapter-element';
import { html } from 'lit-html';


@customElement('bs-accordion-demo')
export class AccordionDemo extends AdapterElement {

	protected override render(): unknown {
		return html`
		<bs-accordion></bs-accordion>
		`;
	}

}
