import { ContainerLoader } from '@roenlie/lit-aegis';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type { IDisposable } from 'monaco-editor';

import type { SiteConfig } from '../../../shared/config.types.js';
import editorCmpTypes from '../../types/editor-component.d.ts?raw';
import { monaco } from '../../utilities/monaco.js';
import { unpkgReplace } from '../../utilities/unpkg-replace.js';
import { createTSWorker } from '../../workers/typescript-worker.js';
import { EsSourceEditor } from './source-editor.js';


@customElement('docs-component-editor')
export class EsComponentEditor extends EsSourceEditor {

	//#region properties
	public override maxHeight = Infinity;
	protected override editorLang = 'typescript' as const;
	protected tsWorker: Worker;
	protected languageDisposable: IDisposable[] = [];
	//#endregion


	//#region lifecycle
	public override async firstUpdated(): Promise<void> {
		this.languageDisposable.push(
			(await monaco).languages.typescript.typescriptDefaults.addExtraLib(editorCmpTypes),
		);

		this.tsWorker = createTSWorker();
		this.tsWorker.onmessage = this.handleWorkerResponse;

		await super.firstUpdated();
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.languageDisposable.forEach(d => d.dispose());
		this.tsWorker.terminate();
	}
	//#endregion


	//#region logic
	protected override async updateHeight() {
		const editor = await this.editor;
		const contentHeight = Math.min(this.maxHeight, this.editorWrapperQry.clientHeight ?? 0 - 50);
		const editorWidth = this.editorQry.clientWidth;

		editor.layout({ width: editorWidth, height: contentHeight });
	}

	protected override handleSlotChange() {
		super.handleSlotChange();
		this.source = this.source
			.replace(/^import { editorComponent }.+/, '')
			.trim();
	}

	protected override async execute() {
		const editor = await this.editor;
		let content = editor.getValue();
		content = `const editorComponent = (builder) => builder;\n` + content;

		const js = unpkgReplace(content);
		this.tsWorker.postMessage(js);
	}

	protected handleWorkerResponse = async (msg: MessageEvent<string>) => {
		const data = msg.data;

		try {
			const encodedJs = encodeURIComponent(data);
			const dataUri = `data:text/javascript;charset=utf-8,${ encodedJs }`;
			const mixins = (await import(/* @vite-ignore */ dataUri)).default({ html, css });

			this.content = html``;
			await this.updateComplete;
			this.content = html`
			<docs-editor-scratchpad .mixins=${ mixins }></docs-editor-scratchpad>
			`;
		}
		catch (error) {
			console.warn('Import failed. Reason:', error);
		}

		this.requestUpdate();
	};
	//#endregion


	//#region styles
	public static override styles = [
		...EsSourceEditor.styles,
		css`
		:host {
			grid-template-rows: 1fr auto auto;
			border: none;
			padding-top: 50px;
		}
		.editor-section {
			resize: none;
			height: auto;
		}
		.resizer {
			border-top: 1px solid var(--midoc-surface-variant);
		}
		`,
	];

	static {
		const cfg = ContainerLoader.get<SiteConfig>('site-config');
		const style = cfg.root?.styleOverrides?.cmpEditor;
		if (style)
			this.styles.push(unsafeCSS(style));
	}
	//#endregion

}


@customElement('docs-editor-scratchpad')
export class EsEditorScratchpad extends LitElement {

	//#region properties
	@property({ type: Object, attribute: false }) public mixins: {
		connectedCallback?(): void;
		disconnectedCallback?(): void;
		render?(): string;
		styles?(): string;
	};
	//#endregion


	//#region lifecycle
	public override connectedCallback(): void {
		super.connectedCallback();
		this.mixins.connectedCallback?.apply(this);
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.mixins.disconnectedCallback?.apply(this);
	}
	//#endregion


	//#region template
	protected override render() {
		const styles = unsafeHTML(`
		<style>${ this.mixins.styles?.apply(this) ?? '' }</style>
		`);

		const template = this.mixins.render?.apply(this);

		return html`
		${ styles ?? '' }
		${ template ?? '' }
		`;
	}
	//#endregion

}
