import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';


@customElement('b-root')
export class RootCmp extends LitElement {

	protected override render(): unknown {
		return html`
		<div id="haiw124n">
		</div>
		`;
	}

	public static override styles = css`
	:host {
	  background-color: #374035;
	}
	
	#haiw124n {
	  background-color: #1e90ff;
	  width: 200px;
	  height: 200px;
	  position: absolute;
	  top: 50px;
	  left: 100px;
	}
	`;

}
