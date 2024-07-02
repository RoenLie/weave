import { DisplayElement } from '@roenlie/mirage-mde-display';
import { css, type CSSResultOrNative, html, type LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { editorToPreview } from '../codemirror/commands/toggle-sidebyside.js';
import { MirageMDE } from '../mirage-mde.js';
import { adoptStyles, CrossDocElement } from './cross-doc-element.js';


@customElement('mirage-mde-window')
export class WindowElement extends CrossDocElement {

	@property({ type: Object }) public scope: MirageMDE;
	@state() protected htmlContent = '';

	public setContent(htmlString: string): void
	public setContent(htmlString: Promise<string>): Promise<string>
	public setContent(htmlString: any): any {
		if (typeof htmlString === 'string')
			this.htmlContent = htmlString;
		else if (htmlString)
			return htmlString.then((s: string) => this.htmlContent = s);
	}

	public override connectedCallback() {
		super.connectedCallback();

		this.scope.gui.window = this;
		editorToPreview(this.scope);
	}

	protected override render() {
		return html`
		<mirage-mde-window-display
			.content=${ this.htmlContent }
		></mirage-mde-window-display>
		`;
	}

	public static override styles = [
		css`
		mirage-mde-window-display::part(markdown-body) {
			padding: 4px;
			word-break: break-word;
			place-self: start center;

			width: clamp(500px, 70vw, 800px);
			border-radius: 16px;
			padding: 16px;
			border: 1px solid rgb(255 255 255 / 10%);

			min-height: calc(100dvh - 50px);
			margin-block: 22px;
		}
		`,
	];

}


@customElement('mirage-mde-window-display')
export class WindowDisplay extends DisplayElement {

	protected override createRenderRoot() {
		const renderRoot = this.shadowRoot ??
			this.attachShadow((this.constructor as any).shadowRootOptions);

		// When adoptedStyleSheets are shimmed, they are inserted into the
		// shadowRoot by createRenderRoot. Adjust the renderBefore node so that
		// any styles in Lit content render before adoptedStyleSheets. This is
		// important so that adoptedStyleSheets have precedence over styles in
		// the shadowRoot.
		this.renderOptions.renderBefore ??= renderRoot!.firstChild as ChildNode;

		const styles = ((this.constructor as typeof LitElement).styles ?? []) as CSSResultOrNative[];

		adoptStyles(renderRoot, styles, this.ownerDocument.defaultView!);

		return renderRoot;
	}

	protected adoptedCallback() {
		// Adopt the old styles into the new document
		if (this.shadowRoot) {
			adoptStyles(
				this.shadowRoot,
				((this.constructor as typeof LitElement).styles ?? []) as CSSResultOrNative[],
				this.ownerDocument.defaultView!,
			);
		}
	}

}


declare global {
	interface HTMLElementTagNameMap {
		'mirage-mde-window': WindowElement;
	}
}
