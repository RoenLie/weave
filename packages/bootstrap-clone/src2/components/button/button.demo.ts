import { AdapterElement, customElement } from '@roenlie/custom-element/adapter-element';
import { html } from 'lit-html';

import { BsButton } from './button.cmp.ts';


@customElement('bs-button-demo')
export class ButtonDemo extends AdapterElement {

	static {
		BsButton;
	}

	protected override render(): unknown {
		return html`
		<bs-button type="primary"  >Primary  </bs-button>
		<bs-button type="secondary">Secondary</bs-button>
		<bs-button type="success"  >Success  </bs-button>
		<bs-button type="danger"   >Danger   </bs-button>
		<bs-button type="warning"  >Warning  </bs-button>
		<bs-button type="info"     >Info     </bs-button>
		<bs-button type="light"    >Light    </bs-button>
		<bs-button type="dark"     >Dark     </bs-button>
		<bs-button type="link"     >Link     </bs-button>

		<input type="color" value="color(255 0 0 / 0.5)" />
		`;
	}

}
