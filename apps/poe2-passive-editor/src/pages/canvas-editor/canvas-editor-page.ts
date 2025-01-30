import { html } from 'lit-html';
import { CustomElement } from '../../app/custom-element.ts';


export class PoeCanvasTree extends CustomElement {

	static { this.register('poe-canvas-editor'); }

	protected override render(): unknown {
		return html`
		Hello
		`;
	}

}
