import { html, LitElement, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import { Weave } from '../main.js';


declare global { interface HTMLElementTagNameMap {
	'w-div': WeaveDivCmp;
	'w-button': WeaveButtonCmp;
} }


@customElement('w-div')
export class WeaveDivCmp extends LitElement {

	@property({ type: String, attribute: true }) public connect: string;
	@property({ type: String, attribute: 'content-listen' }) public contentListen: string;
	@state() protected template: unknown = unsafeHTML('');
	@state() protected styles: unknown = unsafeHTML('');

	public override connectedCallback(): void {
		super.connectedCallback();

		window.addEventListener(this.contentListen, (ev: Event) => {
			const cEvent = ev as CustomEvent<string>;
			this.fetchTemplate(cEvent.detail);
		});
	}

	protected override willUpdate(props: PropertyValues): void {
		super.willUpdate(props);

		if (props.has('connect') && this.connect)
			this.fetchTemplate(this.connect);
	}

	protected fetchTemplate(path: string) {
		const url = new URL(path, Weave.base);

		fetch(url).then(r => r.json()).then(([ template, style ]) => {
			this.template = unsafeHTML(template);
			this.styles = unsafeHTML(style);
		});
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


@customElement('w-button')
export class WeaveButtonCmp extends LitElement {

	@property({ type: String, attribute: 'content-emit' }) public contentEmit: `${ string }:${ string }`;
	@state() protected template: unknown = unsafeHTML('');
	@state() protected styles: unknown = unsafeHTML('');

	protected override willUpdate(props: PropertyValues): void {
		super.willUpdate(props);
	}

	public override render() {
		return html`
		<style>
			${ this.styles }
		</style>

		<button @click=${ () => {
			const [ name, route ] = this.contentEmit.split(':');
			const event = new CustomEvent(name!, { detail: route! });

			window.dispatchEvent(event);
		} }>
			<slot></slot>
		</button>
		`;
	}

}
