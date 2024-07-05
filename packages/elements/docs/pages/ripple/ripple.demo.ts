import { MMRipple } from '@roenlie/elements/ripple';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';

MMRipple.register();


@customElement('mm-ripple-demo')
export class NavRailDemo extends LitElement {

	protected override render() {
		return html`
		<mm-ripple speed=2000>
			<button>RIPPLE</button>
		</mm-ripple>
		`;
	}

	public static override styles = [
		css`
		:host {
			display: grid;
		}
		mm-ripple {
			width: max-content;
		}
		button {
			all: unset;
			display: grid;
			place-items: center;
			height: 100px;
			width: 100px;
			background-color: dodgerblue;
			border-radius: 4px;
		}
		`,
	];

}
