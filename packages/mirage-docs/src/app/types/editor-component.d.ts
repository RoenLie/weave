import type { CSSResult, CSSResultGroup, TemplateResult } from 'lit';


declare global {

	type EditorComponentBuilder = (api: {
		html: (strings: TemplateStringsArray, ...values: unknown[]) => TemplateResult;
		css: (strings: TemplateStringsArray, ...values: (CSSResultGroup | number)[]) => CSSResult;
	}) => ({
		connectedCallback?(this: EditorElement): void;
		disconnectedCallback?(this: EditorElement): void;
		render?(this: EditorElement): TemplateResult;
		styles?(this: EditorElement): CSSResult;
	});

	class EditorElement {

		public requestUpdate(): void;

	}

	// eslint-disable-next-line no-var
	var editorComponent: (builder: EditorComponentBuilder) => EditorComponentBuilder;

}
