import { ContainerLoader } from '@roenlie/lit-aegis';
import { css, html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { type DirectiveResult } from 'lit/directive.js';
import type { UnsafeHTMLDirective } from 'lit/directives/unsafe-html.js';

import type { SiteConfig } from '../../../shared/config.types.js';
import { debounce } from '../../utilities/debounce.js';
import { drag } from '../../utilities/drag.js';
import { type LoadedEditor, monaco } from '../../utilities/monaco.js';
import { unpkgReplace } from '../../utilities/unpkg-replace.js';


@customElement('docs-source-editor')
export class EsSourceEditor extends LitElement {

	//#region state
	@property({ type: String })                            public source: string;
	@property({ type: Boolean })                           public immediate: boolean;
	@property({ type: Boolean, attribute: 'auto-height' }) public autoHeight: boolean;
	@property({ type: Number, attribute: 'max-height' })   public maxHeight = Infinity;
	@state() public content: TemplateResult | DirectiveResult<typeof UnsafeHTMLDirective> = html``;
	//#endregion


	//#region properties
	protected editorLang: 'javascript' | 'typescript' = 'javascript';
	protected resolveEditor: (editor: LoadedEditor) => any;
	protected editor: Promise<LoadedEditor>;
	protected get vsTheme() {
		const scheme = document.documentElement.getAttribute('color-scheme') ?? 'dark';

		return scheme === 'dark' ? 'vs-dark' : 'vs';
	}
	//#endregion


	//#region controllers
	protected readonly resizeObs = new ResizeObserver(() => this.updateHeight());
	protected readonly documentElementObserver =
		new MutationObserver((_mutations) => this.handleColorScheme());
	//#endregion


	//#region queries
	@query('.outlet')         protected outletQry: HTMLElement;
	@query('.editor')         protected editorQry: HTMLElement;
	@query('.panel')          protected panelQry: HTMLElement;
	@query('.editor-wrapper') protected editorWrapperQry: HTMLElement;
	//#endregion


	//#region lifecycle
	public override connectedCallback() {
		super.connectedCallback();

		let resolve: (editor: LoadedEditor) => any = () => {};
		this.editor = new Promise<LoadedEditor>(res => resolve = res);
		this.resolveEditor = resolve;

		this.resizeObs.observe(window.document.body);
		this.documentElementObserver.observe(document.documentElement, {
			attributes:      true,
			attributeFilter: [ 'color-scheme' ],
		});
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();

		this.editor.then(ed => ed.dispose());
		this.resizeObs.disconnect();
		this.documentElementObserver.disconnect();
	}

	public override async firstUpdated() {
		this.resizeObs.observe(this.editorWrapperQry);

		const editor = (await monaco).editor.create(this.editorQry, {
			value:                   this.source,
			language:                this.editorLang,
			scrollbar:               { alwaysConsumeMouseWheel: false },
			scrollBeyondLastLine:    !this.autoHeight,
			wordWrap:                'on',
			wrappingStrategy:        'advanced',
			minimap:                 { enabled: false },
			overviewRulerLanes:      3,
			fontFamily:              'Cascadia Code',
			fontLigatures:           true,
			theme:                   this.vsTheme,
			bracketPairColorization: { enabled: true },
			guides:                  { bracketPairs: true },
		});

		this.resolveEditor(editor);

		editor.onDidContentSizeChange(() => this.updateHeight());
		editor.onDidChangeModelContent(this.delayedExecute);

		this.setInitialHeight();
		this.updateHeight();

		if (this.immediate)
			await this.execute(true);
	}
	//#endregion


	//#region logic
	protected async setInitialHeight() {
		const editor = await this.editor;

		if (this.autoHeight) {
			if (this.maxHeight !== Infinity) {
				// Based on: https://github.com/microsoft/monaco-editor/issues/794#issuecomment-688959283
				this.editorWrapperQry.style.setProperty('height',
					Math.min(this.maxHeight, editor.getContentHeight() + 50) + 'px');
			}
		}
		else {
			this.editorWrapperQry.style.setProperty('max-height', this.maxHeight + 'px');
		}
	}

	protected async updateHeight() {
		const editor = await this.editor;

		const contentHeight = Math.min(this.maxHeight, this.editorWrapperQry.clientHeight ?? 0 - 50);
		const editorWidth = this.editorQry.clientWidth;

		editor.layout({ width: editorWidth, height: contentHeight });
		// doing a second call to layout to recalculate the height after setting it
		// this fixes a bug where when in auto initial height, the first row is not visible.
		editor.layout();
	}

	protected delayedExecute = debounce(() => this.execute(), 1000);

	protected async execute(force = false) {
		const editor = await this.editor;
		const js = unpkgReplace(editor.getValue());
		const encodedJs = encodeURIComponent(js);
		const dataUri = `data:text/javascript;charset=utf-8,${ encodedJs }`;

		try {
			this.content = (await import(/*@vite-ignore*/dataUri)).default;
		}
		catch (error) {
			console.warn('Import failed. Reason:', error);
			if (force === true)
				this.content = html`${ error }`;
		}

		this.requestUpdate();
	}

	protected clearContent() {
		this.content = html``;
	}

	protected handleSlotChange() {
		const slottedScript = this.querySelector('script');
		const scriptContent = slottedScript?.textContent ?? '';
		if (scriptContent)
			this.source = scriptContent;
	}

	protected async handleColorScheme() {
		const editor = await this.editor;
		editor.updateOptions({ theme: this.vsTheme });
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
	//#endregion


	//#region template
	public override render() {
		return html`
		<link
			rel="stylesheet"
			type="text/css"
			data-name="vs/editor/editor.main"
			href="https://cdn.jsdelivr.net/npm/monaco-editor@0.34.1/min/vs/editor/editor.main.css"
		></link>

		<div class="editor-section panel">
			<div class="editor-wrapper">
				<div class="editor"></div>
			</div>

			<div class="resizer" @pointerdown=${ this.handleResizeWrapper }>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					fill="currentColor"
					class="bi bi-grip-vertical"
					viewBox="0 0 15 16"
				>
					<path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2
						0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1
						1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2
						0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0
						1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"
					/>
				</svg>
			</div>

			<div class="outlet">
				${ this.content }
			</div>
		</div>

		<div class="actions">
			<button @click=${ () => this.execute(true) }>Execute</button>
			<button @click=${ this.clearContent }>Clear</button>
		</div>

		<div hidden>
			<slot @slotchange=${ this.handleSlotChange.bind(this) }></slot>
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		css`
		:host {
			display: grid;
			overflow: hidden;
			margin: 5px;
			gap: 8px;
			border-radius: var(--midoc-border-radius-s);
			border: 1px solid var(--midoc-surface-variant);
		}
		.editor-section {
			display: grid;
			grid-template-columns: 1fr auto 1fr;
			gap: 8px;
			border-bottom: 1px solid var(--midoc-surface-variant);
			overflow: hidden;
			resize: vertical;
			height: 500px;
		}
		.resizer {
			cursor: ew-resize;
			display: grid;
			place-items: center;
			border: 1px solid var(--midoc-surface-variant);
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

	static {
		const cfg = ContainerLoader.get<SiteConfig>('site-config');
		const style = cfg.root?.styleOverrides?.sourceEditor;
		if (style)
			this.styles.push(unsafeCSS(style));
	}
	//#endregion

}
