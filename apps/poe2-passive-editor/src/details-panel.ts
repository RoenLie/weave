import { CustomElement, signal } from './custom-element.ts';
import { html } from 'lit-html';


export class DetailsPanel extends CustomElement {

	static { this.register('details-panel'); }

	@signal public accessor data = {};

	protected override afterConnected(): void {
	}

	protected onKeydown(ev: KeyboardEvent) {
		console.log(ev);

		if (ev.code === 'Tab')
			ev.preventDefault();
		if (ev.code === 'Enter')
			ev.preventDefault();
		if (ev.code === 'Escape')
			ev.preventDefault();
		if (ev.code === 'Delete') {
			console.log('STOOOOP');

			ev.preventDefault();
			ev.stopImmediatePropagation();
			ev.stopPropagation();
		}

		const target = ev.target as HTMLPreElement;

		this.data = JSON.parse(target.innerText);

		const sel = (this.shadowRoot as any as Document).getSelection() as Selection;
		this.renderComplete.then(() => {
			sel.setPosition(sel.anchorNode, 5);
		});
	}

	protected override render(): unknown {
		return html`
		<pre contenteditable @keydown=${ this.onKeydown }>${
			JSON.stringify(this.data, null, 2).trim()
		}</pre>
		`;
	}

}
