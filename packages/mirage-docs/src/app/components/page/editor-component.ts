import { css, CSSResult, type CSSResultGroup, html, type TemplateResult } from 'lit';


type EditorComponentBuilder = (api: {
	html: (strings: TemplateStringsArray, ...values: unknown[]) => TemplateResult;
	css: (strings: TemplateStringsArray, ...values: (CSSResultGroup | number)[]) => CSSResult;
}) => ({
	connectedCallback?(this: EditorElement): void;
	disconnectedCallback?(this: EditorElement): void;
	render?(this: EditorElement): TemplateResult;
	styles?(this: EditorElement): CSSResult;
});


export const editorComponent = (builder: EditorComponentBuilder) => (api: {
	html: typeof html,
	css: typeof css,
}) => {
	return builder(api);
};
