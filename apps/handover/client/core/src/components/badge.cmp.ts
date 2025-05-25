import { AdapterElement, customElement } from '@roenlie/custom-element/adapter';
import { Directive, directive, html, noChange, type PartInfo } from '@roenlie/custom-element/shared';


@customElement('ho-badge')
export class Badge extends AdapterElement {

	protected override render(): unknown {
		console.dir(this.element.renderRoot);

		return html`

		`;
	}

}


class SomeDirective extends Directive {

	constructor(part: PartInfo) {
		super(part);

		console.log('SomeDirective', part);
	}

	render(...props: unknown[]): unknown {
		return noChange;
	}

}

const something = directive(SomeDirective);
