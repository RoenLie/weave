import { CSSResult, type CSSResultGroup, type CSSResultOrNative, LitElement, supportsAdoptingStyleSheets } from 'lit';


// This function migrates styles from a custom element's constructe stylesheet to a new document.
export const adoptStyles = (shadowRoot: ShadowRoot, styles: CSSResultGroup, defaultView: Window & typeof globalThis) => {
	// If the browser supports adopting stylesheets
	if (supportsAdoptingStyleSheets) {
		// If the styles is an array of CSSResultGroup Objects
		// This happens when styles is passed an array i.e. => static styles = [css`${styles1}`, css`${styles2}`] in the component
		if (Array.isArray(styles) && styles.length) {
			// Define the sheets array by mapping the array of CSSResultGroup objects
			const sheets = styles.map(s => {
				// Create a new stylesheet in the context of the owner document's window
				// We have to cast defaultView as any due to typescript definition not allowing us to call CSSStyleSheet in this conext
				// We have to cast CSSStyleSheet as <any> due to typescript definition not containing replaceSync for CSSStyleSheet
				const sheet = new defaultView.CSSStyleSheet();

				// Update the new sheet with the old styles
				sheet.replaceSync(s as unknown as string);

				// Return the sheet
				return sheet;
			});

			// Set adoptedStyleSheets with the new styles (must be an array)
			shadowRoot.adoptedStyleSheets = sheets;
		}
		else {
			// Create a new stylesheet in the context of the owner document's window
			// We have to cast defaultView as any due to typescript definition not allowing us to call CSSStyleSheet in this conext
			// We have to cast CSSStyleSheet as <any> due to typescript definition not containing replaceSync for CSSStyleSheet
			const sheet = new defaultView.CSSStyleSheet();

			// Update the new sheet with the old styles
			sheet.replaceSync(styles as unknown as string);

			// Set adoptedStyleSheets with the new styles (must be an array)
			shadowRoot.adoptedStyleSheets = [ sheet ];
		}
	}
	else if (Array.isArray(styles)) {
		styles.forEach((s) => {
			const style = document.createElement('style');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const nonce = (globalThis as any)['litNonce'];
			if (nonce !== undefined)
				style.setAttribute('nonce', nonce);

			style.textContent = (s as CSSResult).cssText;
			shadowRoot.appendChild(style);
		});
	}
};


export class CrossDocElement extends LitElement {

	protected override createRenderRoot() {
		const renderRoot = this.shadowRoot ?? this.attachShadow(
			(this.constructor as any).shadowRootOptions,
		);

		// When adoptedStyleSheets are shimmed, they are inserted into the
		// shadowRoot by createRenderRoot. Adjust the renderBefore node so that
		// any styles in Lit content render before adoptedStyleSheets. This is
		// important so that adoptedStyleSheets have precedence over styles in
		// the shadowRoot.
		this.renderOptions.renderBefore ??= renderRoot!.firstChild as ChildNode;

		adoptStyles(
			renderRoot,
			((this.constructor as typeof LitElement).styles ?? []) as CSSResultOrNative[],
			this.ownerDocument.defaultView!,
		);

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
