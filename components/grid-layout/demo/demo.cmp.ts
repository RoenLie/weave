import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('demo-element')
export class DemoCmp extends LitElement {

	protected override render(): unknown {
		return html`
		<widget-grid>
			<s-box class="blue"></s-box>
			<s-box class="red"></s-box>
			<s-box class="purple"></s-box>
		</widget-grid>
		`;
	}

	public static override styles = css`
	s-box {
		display: block;
		border: 1px solid grey;
		height: 20px;
	}
	.blue {
		background-color: dodgerblue;
	}
	.red {
		background-color: firebrick;
	}
	.purple {
		background-color: darkslateblue;
	}

	`;

}
