import { AdapterElement, type CSSStyle, customElement } from '@roenlie/custom-element/adapter-element';
import { html } from 'lit-html';

import { styleVariables } from '../../style-variables.ts';
import { createAccordionStyles } from './accordion-styles.ts';


@customElement('bs-accordion')
export class BsAccordion extends AdapterElement {

	protected override render(): unknown {
		return html`
		HEI
		`;
	}

	static prefix = 'bs-';
	static override styles: CSSStyle = createAccordionStyles({
		prefix:    this.prefix,
		variables: styleVariables,
	});

}
