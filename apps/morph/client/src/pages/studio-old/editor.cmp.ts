import { consume, type ContextProp } from '@roenlie/lit-context';
import { customElement, MimicElement } from '@roenlie/mimic-lit/element';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import { editor } from 'monaco-editor';

import type { Module } from '../../features/code-module/module-model.js';
import { MonacoEditorCmp } from '../../features/components/monaco/monaco-editor.cmp.js';
import { sharedStyles } from '../../features/styles/shared-styles.js';
import { EditorTabs } from './editor-tabs.js';
import type { StudioStore } from './studio-store.js';

MonacoEditorCmp.register();
EditorTabs.register();

export interface EditorTab {
	key: string;
	module: Module;
	model?: editor.ITextModel;
	state?: editor.ICodeEditorViewState;
}

@customElement('m-editor')
export class EditorCmp extends MimicElement {

	@property({ attribute: 'tab-placement', reflect: true })
	public tabPlacement: 'none' | 'top' | 'left' | 'right' = 'top';

	@consume('store') protected store: ContextProp<StudioStore>;
	protected editorRef: Ref<MonacoEditorCmp> = createRef();

	protected get tabs() {
		return [ ...this.store.value.editorTabs ].map(([ , tab ]) => ({
			key:   tab.key,
			value: `${ tab.module.namespace }/${ tab.module.name }`,
		}));
	}

	public get editor() {
		return this.editorRef.value;
	}

	protected handle = {
		saveEditorState: this.saveEditorState.bind(this),
		activeEditorTab: this.onActiveEditorTab.bind(this),
		tabClick:        (ev: CustomEvent<string>) => {
			this.store.value.activeModuleId = ev.detail;
		},
	};

	public override connectedCallback() {
		super.connectedCallback();
		import('../../features/components/monaco/monaco-editor.cmp.js').then(m =>
			m.MonacoEditorCmp.register());

		this.store.value.connect(
			this,
			'activeModuleId',
			'editorTabs',
			'activeEditorTab',
		);
		this.store.value.listen(
			this,
			'activeEditorTab',
			this.handle.activeEditorTab,
		);
		this.store.value.listen(
			this,
			'activeEditorTab',
			this.handle.saveEditorState,
			{
				type: 'before',
			},
		);
	}

	public override afterConnectedCallback() {
		this.onActiveEditorTab();
	}

	public override disconnectedCallback(): void {
		this.saveEditorState();
		super.disconnectedCallback();
	}

	protected saveEditorState() {
		const activeTab = this.store.value.activeEditorTab;
		const editor = this.editorRef.value?.editor;
		if (!activeTab || !editor)
			return;

		activeTab.state = editor.saveViewState() ?? undefined;
	}

	protected async onActiveEditorTab() {
		const store = this.store.value;
		const activeTab = store.activeEditorTab;
		if (!activeTab)
			return;

		await this.updateComplete;
		const editorRef = this.editorRef.value;
		if (!editorRef)
			return;

		await editorRef.editorReady;
		const editorInstance = editorRef?.editor;
		if (!editorInstance)
			return;

		if (!activeTab.model)
			activeTab.model = editor.createModel(activeTab.module.code, 'typescript');

		editorInstance.setModel(activeTab.model);
		editorInstance.restoreViewState(activeTab.state ?? null);
		editorInstance.focus();

		this.requestUpdate();
		await this.updateComplete;
		this.requestUpdate();

		const tab = this.shadowRoot?.getElementById(activeTab.key);
		tab?.scrollIntoView();
	}

	protected override render() {
		const direction = this.tabPlacement === 'top' ? 'horizontal' : 'vertical';
		const placement = this.tabPlacement === 'left' ? 'start' : 'end';

		return html`
		<m-editor-tabs
			direction=${ direction }
			placement=${ placement }
			.tabs=${ this.tabs }
			.activeTab=${ this.store.value.activeModuleId }
			@m-tab-click=${ this.handle.tabClick }
		></m-editor-tabs>

		<monaco-editor ${ ref(this.editorRef) }
		></monaco-editor>
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		`,
		css`
		:host {
			overflow: hidden;
			display: grid;
		}
		:host([tab-placement="none"]) {
			grid-template: "editor" 1fr / 1fr;
		}
		:host([tab-placement="none"]) m-editor-tabs {
			display: none;
		}
		:host([tab-placement="top"]) {
			grid-template: "tabs" max-content "editor" 1fr / 1fr;
		}
		:host([tab-placement="bottom"]) {
			grid-template: "editor" 1fr "tabs" max-content / 1fr;
		}
		:host([tab-placement="left"]) {
			grid-template: "tabs editor" 1fr / 1fr max-content;
		}
		:host([tab-placement="right"]) {
			grid-template: "editor tabs" 1fr / 1fr max-content;
		}
		m-editor-tabs {
			grid-area: tabs;
			background-color: var(--surface1);
			--m-active-tab-background: var(--surface);
		}
		monaco-editor {
			grid-area: editor;
		}
		`,
	];

}
