import { css, html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { type DirectiveResult } from 'lit/directive.js';
import type { UnsafeHTMLDirective } from 'lit/directives/unsafe-html.js';

import type { SiteConfig } from '../../../shared/config.types.js';
import { ContainerLoader } from '../../aegis/index.js';
import { drag } from '../../utilities/drag.js';


@customElement('docs-source-editor')
export class SourceEditor extends LitElement {

	//public static refs = [ MonacoEditorCmp ];

	constructor() {
		super();

		const cfg = ContainerLoader.get<SiteConfig>('site-config');
		const style = cfg.root.styleOverrides.sourceEditor;

		const base = (this.constructor as typeof LitElement);
		if (style && Array.isArray(base.styles))
			base.styles.push(unsafeCSS(style));
	}

	//#region state
	@property({ type: String })                            source: string;
	@property({ type: Number, attribute: 'max-height' })   maxHeight = Infinity;
	@state() content = html`` as TemplateResult | DirectiveResult<typeof UnsafeHTMLDirective>;
	//#endregion


	//#region queries
	@query('.outlet')         protected outletQry:        HTMLElement;
	@query('.panel')          protected panelQry:         HTMLElement;
	@query('.editor-wrapper') protected editorWrapperQry: HTMLElement;
	//@query('monaco-editor')   protected editorQry?:       MonacoEditorCmp;
	//#endregion


	//#region lifecycle
	override async firstUpdated() {
		//this.delayedExecute();
	}
	//#endregion


	//#region logic
	//protected delayedExecute = debounce(() => this.execute(), 1000);

	//protected async execute() {
	//	if (!this.editorQry?.editor)
	//		return;

	//	const js = unpkgReplace(this.editorQry.editor.getValue());
	//	const encodedJs = encodeURIComponent(js);
	//	const dataUri = `data:text/javascript;charset=utf-8,${ encodedJs }`;

	//	try {
	//		this.content = (await import(/*@vite-ignore*/dataUri)).default;
	//	}
	//	catch (error) {
	//		console.warn('Import failed. Reason:', error);
	//		this.content = html`${ error }`;
	//	}

	//	this.requestUpdate();
	//}

	protected clearContent() {
		this.content = html``;
	}

	protected handleSlotChange() {
		const slottedScript = this.querySelector('script');
		const scriptContent = slottedScript?.textContent ?? '';
		if (scriptContent)
			this.source = scriptContent;
	}

	protected handleResizeWrapper = (ev: PointerEvent) => {
		ev.preventDefault();

		drag(
			this.panelQry,
			{
				onMove: ({ x }) => {
					const resizer = 18 / 2;
					const gap = 8;

					const totalWidth = this.panelQry.offsetWidth;
					const percentage = ((x - (resizer + gap)) / totalWidth) * 100;
					const buffer = (((resizer * 2) + (gap * 2)) / totalWidth) * 100;

					Object.assign(this.panelQry.style, {
						'gridTemplateColumns': Math.min(percentage, (100 - buffer))
							+ '%' + ' auto ' + '1fr',
					});
				},
				initialEvent: ev,
			},
		);
	};

	protected onEditorChange() {
		//this.source = this.editorQry?.editor?.getValue() ?? '';
	}
	//#endregion


	//#region template
	override render() {
		return html`
		Live editor currently undergoing reworks.
		`;

		//return html`
		//<div class="editor-section panel">
		//	<div class="editor-wrapper">
		//		<monaco-editor
		//			language="typescript"
		//			.value=${ this.source }
		//			@change=${ this.onEditorChange }
		//		></monaco-editor>
		//	</div>

		//	<div class="resizer" @pointerdown=${ this.handleResizeWrapper }>
		//		<svg
		//			xmlns="http://www.w3.org/2000/svg"
		//			width="16"
		//			height="16"
		//			fill="currentColor"
		//			class="bi bi-grip-vertical"
		//			viewBox="0 0 15 16"
		//		>
		//			<path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2
		//				0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1
		//				1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2
		//				0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0
		//				1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"
		//			/>
		//		</svg>
		//	</div>

		//	<div class="outlet">
		//		${ this.content }
		//	</div>
		//</div>

		//<div class="actions">
		//	<button @click=${ () => this.delayedExecute() }>Execute</button>
		//	<button @click=${ this.clearContent }>Clear</button>
		//</div>

		//<div hidden>
		//	<slot @slotchange=${ this.handleSlotChange.bind(this) }></slot>
		//</div>
		//`;
	}
	//#endregion


	//#region style
	static override styles = [
		css`
		:host {
			display: grid;
			overflow: hidden;
			margin: 5px;
			gap: 8px;
			border-radius: var(--midoc-border-radius-s);
			border: 1px solid var(--midoc-outline);
		}
		.editor-section {
			display: grid;
			grid-template-columns: 1fr auto 1fr;
			gap: 8px;
			border-bottom: 1px solid var(--midoc-outline);
			overflow: hidden;
			resize: vertical;
			height: 500px;
		}
		.resizer {
			cursor: ew-resize;
			display: grid;
			place-items: center;
			border: 1px solid var(--midoc-outline);
			border-top: none;
			border-bottom: none;
		}
		svg {
			display: block;
			width: 1em;
			height: 1em;
		}
		.editor-wrapper {
			position: relative;
			overflow: hidden;
			display: grid;
			padding-top: var(--midoc-spacing-l);
			padding-bottom: var(--midoc-spacing-l);
			padding-left: var(--midoc-spacing-l);
		}
		.editor {
			display: grid;
			overflow: hidden;
		}
		.monaco-editor,
		.editor-wrapper,
		.editor {
			border-radius: 4px;
		}
		.actions {
			display: flex;
			flex-flow: row;
			padding: var(--midoc-spacing-l);
			gap: 8px;
		}
		.outlet {
			padding-top: var(--midoc-spacing-l);
			padding-bottom: var(--midoc-spacing-l);
			padding-right: var(--midoc-spacing-l);
		}
		button {
			all: unset;
			cursor: pointer;
			display: grid;
			place-items: center;
			position: relative;
			border-radius: 8px;
			background-color: var(--midoc-tertiary);
			color: var(--midoc-on-tertiary);
			width: fit-content;
			padding: 8px;
		}
		button:hover::after {
			content: '';
			position: absolute;
			inset: 0;
			background-color: var(--midoc-tertiary-hover);
			border-radius: inherit;
		}
		`,
	];
	//#endregion

}
