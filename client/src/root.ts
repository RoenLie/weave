import { css, html, LitElement, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';


declare global {
	interface HTMLElementTagNameMap {
		'pl-root': RootCmp;
	}
}


@customElement('w-div')
export class RootCmp extends LitElement {

	@property({ type: String, attribute: true }) public connect: string;
	@state() protected template: unknown = unsafeHTML('');
	@state() protected styles: unknown = unsafeHTML('');

	protected override willUpdate(props: PropertyValues): void {
		super.willUpdate(props);

		if (props.has('connect') && this.connect) {
			const url = new URL(this.connect, 'http://localhost:42069');
			console.log(url);

			fetch(url).then(r => r.json()).then(([ template, style ]) => {
				this.template = unsafeHTML(template);
				this.styles = unsafeHTML(style);
			});
		}
	}


	public override render() {
		return html`
		<style>
			${ this.styles }
		</style>

		${ this.template }
		`;
	}

}
