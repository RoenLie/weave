class VoidContainer extends HTMLElement {

	protected static sheet = (() => {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(`:host{display:none !important;}`);

		return sheet;
	})();

	constructor() {
		super();

		const base = (this.constructor as unknown as typeof VoidContainer);
		const root = this.attachShadow({ mode: 'open' });
		root.adoptedStyleSheets = [ base.sheet ];
	}

}
customElements.define('void-container', VoidContainer);
