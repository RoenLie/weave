import { ITrackedPromise, TrackedPromise } from '@roenlie/core/async';
import { breadthTraverseDOM } from '@roenlie/core/dom';
import { removeSegments } from '@roenlie/core/string';
import { catalogToList } from '@roenlie/core/structs';
import { consume } from '@roenlie/lit-utilities/context';
import { $Container, InjectableElement, injectableElement, injectProp } from '@roenlie/lit-utilities/injectable';
import { Container } from 'inversify';
import { css, html } from 'lit';
import { query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { router } from '../../app/routes/router.js';
import { DrawerCmp } from '../../components/drawer/drawer.cmp.js';
import { $EntityView } from './entity-context.js';
import { EntityPanelElement } from './entity-panel-element.js';
import { type EntityView } from './entity-view.js';
import { EntityListStore, EntityPanelStore, EntityViewStore } from './entity-view-store.js';


@injectableElement('pl-entity-panel')
export class EntityPanelCmp extends InjectableElement {

	//#region Context
	@injectProp($Container) protected container: Container;
	protected viewStore: EntityViewStore;
	protected listStore: EntityListStore;
	protected panelStore: EntityPanelStore;
	//#endregion


	//#region Properties
	@consume('scope') protected scope: string;
	@state() protected tabs: EntityView.Panel.Tab[] = [];
	@state() protected panelApi: EntityView.Panel.Api = {};

	public initialize?: ITrackedPromise<any>;
	public configLoading: ITrackedPromise<any> = TrackedPromise.resolve();

	protected observers: (() => void)[] = [];
	//#endregion


	//#region Queries
	@query('pl-drawer') public drawerQry?: DrawerCmp;
	//#endregion


	//#region Lifecycle
	public override async connectedCallback() {
		super.connectedCallback();

		this.panelStore = this.container.getTagged<EntityPanelStore>($EntityView, 'panelStore', this.scope);
		this.listStore = this.container.getTagged<EntityListStore>($EntityView, 'listStore', this.scope);
		this.viewStore = this.container.getTagged<EntityViewStore>($EntityView, 'viewStore', this.scope);
		this.panelStore.panelEl.set(this);

		this.panelStore.panelTabId.observe(this, value => this.setTabs(value)),
		this.panelStore.panelApiId.observe(this, value => this.setApi(value)),
		this.viewStore.panelConfigId.observe(this, async panelConfigId => {
			if (!panelConfigId)
				return;

			const { apiConfigId, tabConfigId } = await this.container
				.getTaggedAsync<EntityView.Panel.Config>($EntityView, 'panelConfig', panelConfigId);

			this.panelStore.panelApiId.set(apiConfigId);
			this.panelStore.panelTabId.set(tabConfigId);
		});

		this.setTabs(this.panelStore.panelTabId.get(this));
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();
	}
	//#endregion


	//#region Logic
	public async showPanel() {
		this.panelStore.panelOpen.set(true);

		await this.panelApi.show?.({
			view:  this.viewStore,
			list:  this.listStore,
			panel: this.panelStore,
		});

		await Promise.all((() => {
			const panels: EntityPanelElement[] = [];
			breadthTraverseDOM(this, (node, _, endBranch) => {
				if (node instanceof EntityPanelElement) {
					panels.push(node);
					endBranch();
				}
			});

			return panels.map(panel => panel.panelShow());
		})());

		this.drawerQry?.show();
	}

	public async hidePanel() {
		this.panelStore.panelOpen.set(false);

		await this.panelApi.hide?.({
			view:  this.viewStore,
			list:  this.listStore,
			panel: this.panelStore,
		});

		(() => {
			const panels: EntityPanelElement[] = [];
			breadthTraverseDOM(this, (node, _, endBranch) => {
				if (node instanceof EntityPanelElement) {
					panels.push(node);
					endBranch();
				}
			});

			return panels;
		})().forEach(panel => panel.panelHide());

		this.listStore.listEl.update(o => o.keepActive = false);

		const baseRoute = removeSegments(router.location(), '/', 1);
		router.navigate(baseRoute);

		this.drawerQry?.hide();
	}

	protected async setTabs(tabConfigId?: string) {
		if (!tabConfigId)
			return;

		if (!this.initialize) {
			this.initialize = new TrackedPromise(() => {});

			const catalog = await this.container
				.getTaggedAsync<EntityView.Panel.TabCatalog>($EntityView, 'panelTabs', tabConfigId);

			this.tabs = catalogToList(catalog);

			await this.updateComplete;

			if (router.params.has('id')) {
				const id = router.params.get('id')!;

				this.viewStore.selectedEntity.set({ id });
				this.showPanel();
			}

			this.initialize.resolve();
		}
		else {
			await this.configLoading;
			this.configLoading = new TrackedPromise(() => {});

			const catalog = await this.container
				.getTaggedAsync<EntityView.Panel.TabCatalog>($EntityView, 'panelTabs', tabConfigId);

			this.tabs = catalogToList(catalog);
			this.configLoading.resolve();
		}
	}

	protected async setApi(apiConfigId: string) {
		this.configLoading = new TrackedPromise(() => {});
		this.panelApi = await this.container
			.getTaggedAsync<EntityView.Panel.Api>($EntityView, 'panelApi', apiConfigId);

		this.configLoading.resolve();
	}

	protected handleDrawerHide = async (_ev: CustomEvent) => {
		this.hidePanel();
	};
	//#endregion


	//#region Template
	protected override render() {
		return html`
		<pl-drawer
			class       ="drawer-overview"
			placement   ="end"
			@drawer-hide=${ this.handleDrawerHide }
		>
			<pl-tab-group>
				${ repeat(this.tabs, tab => tab, tab => html`
				<pl-tab slot="nav" panel=${ tab.name }>
					${ tab.name }
				</pl-tab>

				<pl-tab-panel name=${ tab.name }>
					${ tab.template()  }
				</pl-tab-panel>
				`) }
			</pl-tab-group>
		</pl-drawer>
		`;
	}

	public static override styles = [
		css`
		:host {
			display: contents;
		}
		pl-drawer::part(body) {
			--body-spacing: 0px;
			--panel-block-padding: 0px;
		}
		@media (max-width: 800px) {
			pl-drawer {
				--panel-size: 100vw;
			}
		}
	`,
	];
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-entity-panel': EntityPanelCmp;
	}
}
