import { paintCycle, sleep } from '@roenlie/core/async';
import { findActiveElement, getFirstSelector } from '@roenlie/core/dom';
import { catalogToList, clone } from '@roenlie/core/structs';
import { curryDebounce } from '@roenlie/core/timing';
import { RecordOf } from '@roenlie/core/types';
import { ifDefined } from '@roenlie/core/validation';
import { consume } from '@roenlie/lit-utilities/context';
import { $Container, InjectableElement, injectableElement, injectProp } from '@roenlie/lit-utilities/injectable';
import { Container } from 'inversify';
import { css, html, TemplateResult } from 'lit';
import { query, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import { router } from '../../app/routes/router.js';
import { ListCmp, ListTemplateConfig } from '../../components/list/list.cmp.js';
import { animateLoading } from '../../utility/animate-loading-overlay.js';
import { $EntityView } from './entity-context.js';
import { type EntityView } from './entity-view.js';
import { EntityListStore, EntityPanelStore, EntityViewStore } from './entity-view-store.js';


@injectableElement('pl-entity-list')
export class EntityListCmp extends InjectableElement {

	//#region Context
	@injectProp($Container) protected container: Container;
	protected viewStore: EntityViewStore;
	protected listStore: EntityListStore;
	protected panelStore: EntityPanelStore;
	//#endregion


	//#region Properties
	@consume('scope') protected scope: string;
	@state() public loading = false;
	@state() public keepActive = false;
	@state() protected listApi: EntityView.List.Api = { load: () => ([]) };
	@state() protected listFields: EntityView.List.Field[] = [];
	@state() protected listActions: EntityView.List.Action[] = [];
	@query('.spinner') protected spinnerQry?: HTMLElement;
	@query('pl-template-list') public listQry?: ListCmp<RecordOf<{id: string}>>;
	protected entities: object[] = [];
	protected initialize = Promise.resolve([] as any[]);
	protected listConfig: ListTemplateConfig = {
		header:      () => html``,
		headerField: [],
		row:         () => html``,
		rowField:    [],
	};
	//#endregion


	//#region Lifecycle
	public override connectedCallback() {
		super.connectedCallback();

		this.viewStore = this.container.getTagged<EntityViewStore>($EntityView, 'viewStore', this.scope);
		this.listStore = this.container.getTagged<EntityListStore>($EntityView, 'listStore', this.scope);
		this.panelStore = this.container.getTagged<EntityPanelStore>($EntityView, 'panelStore', this.scope);

		this.listStore.listEl.set(this);
		this.listStore.listApiId   .observe(this, () => this.reset());
		this.listStore.listFieldId .observe(this, () => this.reset());
		this.listStore.listActionId.observe(this, () => this.reset());
		this.viewStore.listConfigId.observe(this, async (listConfigId) => {
			if (!listConfigId)
				return;

			const listConfig = await this.container
				.getTaggedAsync<EntityView.List.Config>($EntityView, 'listConfig', listConfigId);

			this.listStore.listApiId.set(listConfig.apiConfigId);
			this.listStore.listFieldId.set(listConfig.fieldConfigId);
			this.listStore.listActionId.set(listConfig.actionConfigId);
		});
	}
	//#endregion


	//#region Logic
	protected async handleAction(action: EntityView.List.Action['handler']) {
		await animateLoading(
			this,
			() => this.spinnerQry,
			async () => await action({
				entityId: '',
				fields:   this.listFields,
				view:     this.viewStore,
				list:     this.listStore,
				panel:    this.panelStore,
			}),
		);
	}

	public reset = curryDebounce(0, async () => {
		const getPromise = (id: string, name: string, then: (v: any) => any) => {
			return ifDefined(id,
				v => this.container.getTaggedAsync<any>($EntityView, name, v).then(then));
		};

		this.initialize = Promise.allSettled([
			getPromise(this.listStore.listApiId.get(this), 'listApi', v => this.listApi = clone(v)),
			getPromise(this.listStore.listFieldId.get(this), 'listFields', v => this.listFields = catalogToList(clone(v))),
			getPromise(this.listStore.listActionId.get(this), 'listActions', v => this.listActions = catalogToList(clone(v))),
		]);

		await this.initialize;

		this.listConfig = {
			header: (template: TemplateResult | unknown) => html`
			<pl-header>
				${ template }
			</pl-header>
			`,
			headerField: this.listFields.map(field => () => html`
			<pl-field style=${ styleMap({ width: (field.width ?? 150) + 'px;' }) }>
				${ field.label }
			</pl-field>
			`),
			row: (row, template: TemplateResult | unknown) => html`
			<pl-row ?active=${ row.id === this.viewStore.selectedEntity.get(this)?.id } .item=${ row }>
				${ template }
			</pl-row>
			`,
			rowField: this.listFields.map(field => (rowData: RecordOf) => html`
			<pl-field style=${ styleMap({ width: (field.width ?? 150) + 'px;' }) }>
				${ rowData[field.path] }
			</pl-field>
			`),
		};

		await this.load();
	});

	public async load() {
		animateLoading(this, () => this.spinnerQry, async () => {
			this.entities = await this.listApi.load();

			this.requestUpdate();
			await this.updateComplete;

			this.listQry?.reset();
		});
	}

	protected lastClickedEl: HTMLElement;
	protected handleListSelectRow = (ev: HTMLElementEventMap['pl-select-row']) => {
		this.viewStore.selectedEntity?.set(ev.detail.row.item as {id: string});
	};

	protected handleListActivateRow = (ev: HTMLElementEventMap['pl-activate-row']) => {
		const entity = ev.detail.row.item as { id: string; };
		const selectedEntity = this.viewStore.selectedEntity.get(this);

		if (selectedEntity?.id !== entity.id)
			return;

		if (selectedEntity.id) {
			this.keepActive = true;
			router.navigate(router.location() + '/' + selectedEntity.id);

			this.panelStore.panelEl.get(this).showPanel();
		}
	};

	protected handleListAppend = async (ev: HTMLElementEventMap['pl-append-items']) => {
		ev.detail.addPromise(sleep(500));
	};

	protected handleListFocusout = async () => {
		await paintCycle();

		const openButtonHasFocus = () => {
			const activeEl = findActiveElement(this);
			if (activeEl) {
				const firstButton = getFirstSelector(activeEl, 'pl-button');
				if (firstButton?.matches('.open-button')) {
					firstButton.addEventListener('focusout', async () => {
						await paintCycle();

						const active = findActiveElement(this);
						if (!active)
							this.viewStore.selectedEntity?.set(undefined);
					}, { once: true });

					return true;
				}
			}

			return false;
		};

		if (this.keepActive || openButtonHasFocus())
			return;

		this.viewStore.selectedEntity?.set(undefined);
	};

	protected async handleClickOpenButton() {
		await paintCycle();

		this.listQry?.previousFocus?.focus();

		const selectedEntity = this.viewStore.selectedEntity.get(this);
		if (selectedEntity?.id) {
			this.keepActive = true;
			router.navigate(router.location() + '/' + selectedEntity.id);

			this.panelStore.panelEl.get(this).showPanel();
		}
	}
	//#endregion


	//#region Template
	public override render() {
		return html`
		<section class="actions">
			${ map(this.listActions.filter(a => a.condition({
				entityId: '',
				fields:   this.listFields,
				view:     this.viewStore,
				list:     this.listStore,
				panel:    this.panelStore,
			})), action => html`
			<pl-button @click=${ () => this.handleAction(action.handler) }>
				${ action.label }
			</pl-button>
			`) }
		</section>

		<pl-template-list
			.items    =${ this.entities }
			.templates=${ {
				header:      this.listConfig.header,
				headerField: this.listConfig.headerField,
				row:         this.listConfig.row,
				rowField:    this.listConfig.rowField,
			} }
			@pl-select-row  =${ this.handleListSelectRow }
			@pl-activate-row=${ this.handleListActivateRow }
			@pl-append-items=${ this.handleListAppend }
			@focusout       =${ this.handleListFocusout }
		></pl-template-list>

		${ when(this.viewStore?.selectedEntity.get(this)?.id, () => html`
		<pl-button
			class="open-button"
			@click=${ this.handleClickOpenButton.bind(this) }
		>Open
		</pl-button>
		`) }


		${ when(this.loading, () => html`
		<div class="spinner">
			<pl-spinner></pl-spinner>
		</div>
		`) }
		`;
	}

	public static override styles = [
		css`
		:host {
			overflow: hidden;
			position: relative;
			height: 100%;
			width: 100%;
			display: grid;
			grid-template-rows: auto 1fr;
		}
		.actions {
			display: flex;
			flex-flow: row wrap;
			padding: 12px;
			gap: 8px;
		}
		.actions>div {
			display: grid;
			place-items: center;
		}
		.open-button {
			position: absolute;
			right: 25px;
			bottom: 25px;
		}
		.spinner {
			grid-row: 2/3;
			position: absolute;
			inset: 0;
			display: grid;
			place-items: center;
			background-color: var(--transparent-1);
		}
	`,
	];
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-entity-list': EntityListCmp;
	}
}
