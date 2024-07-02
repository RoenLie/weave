import { type ContextProp, consume } from '@roenlie/lit-context';
import { maybe } from '@roenlie/mimic-core/async';
import { MMButton } from '@roenlie/mimic-elements/button';
import { MimicElement, customElement } from '@roenlie/mimic-lit/element';
import { LitElement, html } from 'lit';
import { query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

import { serverUrl } from '../../app/backend-url.js';
import type { DbResponse } from '../../app/response-model.js';
import type { Module } from '../../features/code-module/module-model.js';
import type {
	ModuleNamespace,
	NamespaceDefinition,
} from '../../features/code-module/namespace-model.js';
import { DragHandleCmp } from '../../features/components/drag-handle/drag-handle.cmp.js';
import { sharedStyles } from '../../features/styles/shared-styles.js';
import styles from './editor-panel.css' with { type: 'css' };
import { EditorCmp, type EditorTab } from './editor.cmp.js';
import { ModuleNavSelector } from './module-nav-selector.cmp.js';
import type { StudioStore } from './studio-store.js';
import { StudioTabPanel } from './studio-tab-panel.cmp.js';

MMButton.register();
EditorCmp.register();
DragHandleCmp.register();
StudioTabPanel.register();
ModuleNavSelector.register();

@customElement('m-editor-panel')
export class EditorPanel extends MimicElement {
	@consume('store') protected store: ContextProp<StudioStore>;
	@query('m-editor') protected editorQry?: EditorCmp;
	@state() protected namespaceKeyValues: { key: string; value: string }[] = [];
	@state() protected modulesKeyValues: { key: string; value: string }[] = [];
	@state() protected activeKeyValues: { key: string; value: string }[] = [];
	@state() protected uiMode: 'large' | 'medium' | 'small' = 'large';
	@state() protected activeTab: 'none' | 'editor' | 'details' | 'history' =
		'none';
	protected namespaceList: NamespaceDefinition[] = [];
	protected moduleList: ModuleNamespace[] = [];
	protected resizeObs = new ResizeObserver(([entry]) => {
		if (!entry) return;

		const newUIMode = this.getUiMode(entry.contentRect.width);
		if (this.uiMode === newUIMode) return;

		this.uiMode = newUIMode;

		const moduleActive = !!this.store.value.activeModuleId;
		if (!moduleActive) return;

		if (newUIMode === 'medium') this.activeTab = 'editor';
		if (newUIMode === 'large' && this.activeTab === 'editor')
			this.activeTab = 'details';
	});

	protected tabLists = {
		large: ['details', 'history'],
		medium: ['editor', 'details', 'history'],
		small: [],
	} as const;

	protected drag = new EditorPanelDrag(this);

	public override connectedCallback() {
		super.connectedCallback();
		this.resizeObs.observe(this);

		const store = this.store.value;
		store.connect(this, 'activeNamespace', 'activeModuleId', 'editorTabs');
		store.listen(this, 'activeNamespace', () => this.populateModuleList());
		store.listen(this, 'availableNamespaces', this.setNamespaceKeyValues);
		store.listen(this, 'availableModules', this.setModulesKeyValues);
		store.listen(this, 'activeModuleId', () => this.onActiveModuleId());
		store.listen(this, 'editorTabs', this.setActiveKeyValues);

		this.populateNamespaceList();
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.resizeObs.unobserve(this);
	}

	protected async populateNamespaceList() {
		const store = this.store.value;

		const url = new URL(`${serverUrl}/api/code-modules/namespaces`);
		const [result] = await maybe<DbResponse<NamespaceDefinition[]>>(
			(await fetch(url)).json(),
		);
		if (!result) return;

		store.availableNamespaces = result.data;
	}

	protected async populateModuleList() {
		const store = this.store.value;
		if (!store.activeNamespace) {
			this.moduleList = [];
			return [];
		}

		const url = new URL(
			`${serverUrl}/api/code-modules/${store.activeNamespace}`,
		);
		const [result] = await maybe<DbResponse<ModuleNamespace[]>>(
			(await fetch(url)).json(),
		);
		if (!result) {
			store.availableModules = [];
			return;
		}

		store.availableModules = result.data;
	}

	protected selectNamespace(ev: HTMLElementEventMap['m-nav-select-key']) {
		this.store.value.activeNamespace = ev.detail;
	}

	protected async selectModule(ev: HTMLElementEventMap['m-nav-select-key']) {
		const store = this.store.value;
		store.activeModuleId = ev.detail;
	}

	protected onActiveModuleId() {
		this.updateEditorTabs();
	}

	protected async updateEditorTabs() {
		const store = this.store.value;
		const activeId = store.activeModuleId;
		if (!activeId) return;

		// Create tab as it does not exist.
		const existingTab = store.editorTabs.get(activeId);
		if (existingTab) {
			store.activeEditorTab = existingTab;
			return;
		}

		const namespace = store.activeNamespace;
		if (!namespace) return;

		const url = new URL(
			`${serverUrl}/api/code-modules/${namespace}/${activeId}`,
		);
		const [result] = await maybe<DbResponse<Module>>((await fetch(url)).json());
		if (!result) {
			store.activeModuleId = '';
			return;
		}

		const tab: EditorTab = {
			key: activeId,
			module: result.data,
		};

		store.update('editorTabs', tabs => void tabs.set(activeId, tab));
		store.activeEditorTab = tab;
	}

	protected getUiMode(width: number) {
		if (width <= 450) return 'small';
		if (width <= 1440) return 'medium';

		return 'large';
	}

	protected setNamespaceKeyValues = () => {
		const namespaces = this.store.value.availableNamespaces;
		this.namespaceKeyValues = namespaces.map(def => ({
			key: def.namespace,
			value: def.namespace,
		}));
	};

	protected setModulesKeyValues = () => {
		const modules = this.store.value.availableModules;
		this.modulesKeyValues = modules.map(def => ({
			key: def.module_id.toString(),
			value: def.name,
		}));
	};

	protected setActiveKeyValues = () => {
		const store = this.store.value;
		this.activeKeyValues = [...store.editorTabs].map(([, tab]) => ({
			key: tab.key,
			value: `${tab.module.namespace}/${tab.module.name}`,
		}));

		if (this.store.value.activeModuleId) {
			if (this.activeTab === 'none') {
				if (this.uiMode === 'large') this.activeTab = 'details';
				if (this.uiMode === 'medium') this.activeTab = 'editor';
			}
		} else {
			this.activeTab = 'none';
		}
	};

	protected renderTabPanel() {
		if (!this.store.value.activeModuleId) {
			return html`
			<m-studio-tab-panel>
				<s-placeholder>
					Select a module...
				</s-placeholder>
			</m-studio-tab-panel>
			`;
		}

		return html`
		<m-studio-tab-panel>
			${map(
				this.tabLists[this.uiMode],
				tab => html`
			<s-tab
				slot="tab"
				class=${classMap({ active: this.activeTab === tab })}
				@click=${() => {
					this.activeTab = tab;
				}}
			>
				${tab}
			</s-tab>
			`,
			)}

			<button slot="action">ACTION!1</button>
			<button slot="action">ACTION!2</button>
			<button slot="action">ACTION!3</button>
			<button slot="action">ACTION!4</button>
			<button slot="action">ACTION!5</button>
			<button slot="action">ACTION!6</button>
			<button slot="action">ACTION!7</button>
			<button slot="action">ACTION!8</button>
			<button slot="action">ACTION!9</button>
			<button slot="action">ACTION!10</button>
			<button slot="action">ACTION!11</button>
			<button slot="action">ACTION!12</button>
			<button slot="action">ACTION!13</button>
			<button slot="action">ACTION!14</button>
			<button slot="action">ACTION!15</button>
			<button slot="action">ACTION!16</button>
			<button slot="action">ACTION!17</button>
			<button slot="action">ACTION!18</button>
			<button slot="action">ACTION!19</button>

			${choose(this.activeTab, [
				[
					'editor',
					() => html`
					<m-editor
						tab-placement="none"
					></m-editor>
				`,
				],
				[
					'details',
					() => html`
					DETAILS
				`,
				],
				[
					'history',
					() => html`
					HISTORY
				`,
				],
			])}
		</m-studio-tab-panel>
		`;
	}

	protected renderLarge() {
		return html`
		<s-large>
			<s-nav-panel>
				<m-module-nav-selector
					header="Namespaces"
					.activeItem=${this.store.value.activeNamespace}
					.items=${this.namespaceKeyValues}
					@m-nav-select-key=${this.selectNamespace}
				></m-module-nav-selector>

				<m-drag-handle class="horizontal"
					@mousedown=${this.drag.handle.largeModuleNavDrag}
				></m-drag-handle>

				<m-module-nav-selector
					header="Modules"
					.activeItem=${this.store.value.activeModuleId}
					.items=${this.modulesKeyValues}
					@m-nav-select-key=${this.selectModule}
				></m-module-nav-selector>
			</s-nav-panel>

			<m-drag-handle class="vertical"
				@mousedown=${this.drag.handle.largeEditorLeftDrag}
			></m-drag-handle>

			${when(
				this.store.value.activeModuleId,
				() => html`
			<m-editor
				id="editor"
				tab-placement="top"
			></m-editor>
			`,
				() => html`
			<s-editor-placeholder
				id="editor"
			>
				Select a module...
			</s-editor-placeholder>
			`,
			)}

			<m-drag-handle class="vertical"
				@mousedown=${this.drag.handle.largeEditorRightDrag}
			></m-drag-handle>

			${this.renderTabPanel()}
		</s-large>
		`;
	}

	protected renderMedium() {
		return html`
		<s-medium>
			<s-nav-panel>
				<m-module-nav-selector
					header="Namespaces"
					.activeItem=${this.store.value.activeNamespace}
					.items=${this.namespaceKeyValues}
					@m-nav-select-key=${this.selectNamespace}
				></m-module-nav-selector>

				<m-drag-handle class="horizontal"
					@mousedown=${this.drag.handle.mediumNavLeftDrag}
				></m-drag-handle>

				<m-module-nav-selector
					header="Modules"
					.activeItem=${this.store.value.activeModuleId}
					.items=${this.modulesKeyValues}
					@m-nav-select-key=${this.selectModule}
				></m-module-nav-selector>

				<m-drag-handle class="horizontal"
					@mousedown=${this.drag.handle.mediumNavRightDrag}
				></m-drag-handle>

				<m-module-nav-selector
					header="Active"
					.activeItem=${this.store.value.activeModuleId}
					.items=${this.activeKeyValues}
					@m-nav-select-key=${this.selectModule}
				></m-module-nav-selector>
			</s-nav-panel>

			<m-drag-handle class="vertical"
				@mousedown=${this.drag.handle.mediumEditorTopDrag}
			></m-drag-handle>

			${this.renderTabPanel()}
		</s-medium>
		`;
	}

	protected override render(): unknown {
		if (this.uiMode === 'large') return this.renderLarge();
		if (this.uiMode === 'medium') return this.renderMedium();
	}

	public static override styles = [sharedStyles, styles];
}

class EditorPanelDrag {
	constructor(public element: LitElement) {}

	public handle = {
		largeModuleNavDrag: this.largeModuleNavDrag.bind(this),
		largeEditorLeftDrag: this.largeEditorLeftDrag.bind(this),
		largeEditorRightDrag: this.largeEditorRightDrag.bind(this),
		mediumNavLeftDrag: this.mediumNavLeftDrag.bind(this),
		mediumNavRightDrag: this.mediumNavRightDrag.bind(this),
		mediumEditorTopDrag: this.mediumEditorTopDrag.bind(this),
	};

	protected largeModuleNavDrag(ev: MouseEvent) {
		const target = ev.target as HTMLElement;

		const panel =
			this.element.renderRoot.querySelector<HTMLElement>('s-nav-panel');

		const query = 'm-module-nav-selector:first-of-type';
		const selector = this.element.renderRoot.querySelector<HTMLElement>(query);
		if (!selector || !panel) return;

		const selectorRect = selector.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();
		const targetCenter = targetRect.y + targetRect.height / 2;
		const offset = targetCenter - selectorRect.bottom;

		const panelHeight = panel.offsetHeight;
		const minHeight = panelHeight * 0.25;
		const maxHeight = panelHeight * 0.75;

		this.drag(
			selector,
			'height',
			maxHeight,
			minHeight,
			ev => ev.y - selectorRect.y - offset,
		);
	}

	protected largeEditorLeftDrag(ev: MouseEvent) {
		const target = ev.target as HTMLElement;
		const container =
			this.element.renderRoot.querySelector<HTMLElement>('s-large');
		const panel =
			this.element.renderRoot.querySelector<HTMLElement>('s-nav-panel');
		const editor =
			this.element.renderRoot.querySelector<HTMLElement>('#editor');

		if (!container || !panel || !editor) return;

		const editorRect = editor.getBoundingClientRect();
		const panelRect = panel.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();
		const targetCenter = targetRect.x + targetRect.width / 2;
		const offset = targetCenter - panelRect.right;

		const containerWidth = container.offsetWidth;
		const minWidth = containerWidth * 0.15;
		const maxWidth = editorRect.right - panelRect.left - containerWidth * 0.25;

		this.drag(
			panel,
			'width',
			maxWidth,
			minWidth,
			ev => ev.x - panelRect.x - offset,
		);
	}

	protected largeEditorRightDrag(ev: MouseEvent) {
		const target = ev.target as HTMLElement;
		const container =
			this.element.renderRoot.querySelector<HTMLElement>('s-large');
		const panel =
			this.element.renderRoot.querySelector<HTMLElement>('m-studio-tab-panel');
		const editor =
			this.element.renderRoot.querySelector<HTMLElement>('#editor');

		if (!container || !panel || !editor) return;

		const editorRect = editor.getBoundingClientRect();
		const panelRect = panel.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();
		const targetCenter = targetRect.x + targetRect.width / 2;
		const offset = panelRect.left - targetCenter;

		const containerWidth = container.offsetWidth;
		const minWidth = containerWidth * 0.15;
		const maxWidth = panelRect.right - editorRect.x - containerWidth * 0.25;

		this.drag(
			panel,
			'width',
			maxWidth,
			minWidth,
			ev => panelRect.right - ev.x - offset,
		);
	}

	protected mediumNavLeftDrag(ev: MouseEvent) {
		const target = ev.target as HTMLElement;
		const container =
			this.element.renderRoot.querySelector<HTMLElement>('s-nav-panel');
		const leftPanel = this.element.renderRoot.querySelector<HTMLElement>(
			'm-module-nav-selector:nth-of-type(1)',
		);
		const center = this.element.renderRoot.querySelector<HTMLElement>(
			'm-module-nav-selector:nth-of-type(2)',
		);

		if (!container || !leftPanel || !center) return;

		const targetRect = target.getBoundingClientRect();
		const leftPanelRect = leftPanel.getBoundingClientRect();
		const centerRect = center.getBoundingClientRect();

		const targetCenter = targetRect.x + targetRect.width / 2;
		const offset = targetCenter - leftPanelRect.right;

		const containerWidth = container.offsetWidth;
		const minWidth = containerWidth * 0.15;
		const maxWidth =
			centerRect.right - leftPanelRect.left - containerWidth * 0.25;

		this.drag(
			leftPanel,
			'width',
			maxWidth,
			minWidth,
			ev => ev.x - leftPanelRect.x - offset,
		);
	}

	protected mediumNavRightDrag(ev: MouseEvent) {
		const target = ev.target as HTMLElement;
		const container =
			this.element.renderRoot.querySelector<HTMLElement>('s-nav-panel');
		const center = this.element.renderRoot.querySelector<HTMLElement>(
			'm-module-nav-selector:nth-of-type(2)',
		);
		const rightPanel = this.element.renderRoot.querySelector<HTMLElement>(
			'm-module-nav-selector:nth-of-type(3)',
		);

		if (!container || !rightPanel || !center) return;

		const centerRect = center.getBoundingClientRect();
		const panelRect = rightPanel.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();
		const targetCenter = targetRect.x + targetRect.width / 2;
		const offset = panelRect.left - targetCenter;

		const containerWidth = container.offsetWidth;
		const minWidth = containerWidth * 0.15;
		const maxWidth = panelRect.right - centerRect.x - containerWidth * 0.25;

		this.drag(
			rightPanel,
			'width',
			maxWidth,
			minWidth,
			ev => panelRect.right - ev.x - offset,
		);
	}

	protected mediumEditorTopDrag(ev: MouseEvent) {
		const target = ev.target as HTMLElement;

		const container =
			this.element.renderRoot.querySelector<HTMLElement>('s-medium');
		const resizeEl =
			this.element.renderRoot.querySelector<HTMLElement>('s-nav-panel');

		if (!container || !resizeEl) return;

		const resizeRect = resizeEl.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();
		const targetCenter = targetRect.y + targetRect.height / 2;
		const offset = targetCenter - resizeRect.bottom;

		const containerHeight = container.offsetHeight;
		const minHeight = containerHeight * 0.25;
		const maxHeight = containerHeight * 0.75;

		this.drag(
			resizeEl,
			'height',
			maxHeight,
			minHeight,
			ev => ev.y - resizeRect.y - offset,
		);
	}

	protected drag(
		element: HTMLElement,
		property: 'height' | 'width',
		max: number,
		min: number,
		calcDistance: (ev: MouseEvent) => number,
	) {
		const moveFn = (ev: MouseEvent) => {
			ev.preventDefault();

			const distance = calcDistance(ev);
			const size = Math.min(max, Math.max(min, distance));
			element.style.setProperty(property, `${size}px`);
		};

		globalThis.addEventListener('mousemove', moveFn);
		globalThis.addEventListener(
			'mouseup',
			() => globalThis.removeEventListener('mousemove', moveFn),
			{ once: true },
		);
	}
}
