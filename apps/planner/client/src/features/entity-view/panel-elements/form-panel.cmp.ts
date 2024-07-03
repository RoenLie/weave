import { TrackedPromise } from '@roenlie/core/async';
import { catalogToList, clone } from '@roenlie/core/structs';
import { RecordOf } from '@roenlie/core/types';
import { ifDefined } from '@roenlie/core/validation';
import { consume } from '@roenlie/lit-utilities/context';
import { watch } from '@roenlie/lit-utilities/decorators';
import { $Container, injectableElement, injectProp } from '@roenlie/lit-utilities/injectable';
import { Container } from 'inversify';
import { css, html } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined as litIfDefined } from 'lit/directives/if-defined.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

import { animateLoading } from '../../../utility/animate-loading-overlay.js';
import { componentStyles } from '../../shared-styles/component-styles.js';
import { $EntityView } from '../entity-context.js';
import { EntityPanelElement } from '../entity-panel-element.js';
import { type EntityView } from '../entity-view.js';
import { EntityListStore, EntityPanelStore, EntityViewStore } from '../entity-view-store.js';


export const createFormPanel = (options: {
	apiConfig:    string | undefined,
	fieldConfig:  string | undefined,
	actionConfig: string | undefined,
}) => {
	return html`
	<pl-form-panel
		api-config-id   =${ litIfDefined(options.apiConfig) }
		field-config-id =${ litIfDefined(options.fieldConfig) }
		action-config-id=${ litIfDefined(options.actionConfig) }
	></pl-form-panel>
	`;
};


@injectableElement('pl-form-panel')
export class FormPanelCmp extends EntityPanelElement {

	//#region Contexts
	@injectProp($Container) protected container: Container;
	protected viewStore: EntityViewStore;
	protected listStore: EntityListStore;
	protected panelStore: EntityPanelStore;
	//#endregion


	//#region Properties
	@consume('scope') protected scope: string;
	@property({ attribute: 'api-config-id' }) public apiConfigId?: string;

	@property({ attribute: 'field-config-id' }) public fieldConfigId?: string;

	@property({ attribute: 'action-config-id' }) public actionConfigId?: string;

	@state() protected selected: object | undefined = undefined;

	@state() protected formApi: EntityView.Panel.Form.Api = { load: () => ({}), hide: () => {} };

	@state() protected fieldConfig: EntityView.Panel.Form.Field[] = [];

	@state() protected actionConfig: EntityView.Panel.Form.Action[] = [];

	@state() public loading = false;

	public updating = (() => {
		const tracked = new TrackedPromise(() => {});
		tracked.resolve();

		return tracked;
	})();

	protected initialize?: Promise<any[]>;
	//#endregion


	//#region Queries
	@query('.spinner') public spinnerQry?: HTMLElement;
	//#endregion


	//#region Lifecycle
	public override async connectedCallback() {
		super.connectedCallback();

		this.viewStore = this.container.getTagged<EntityViewStore>($EntityView, 'viewStore', this.scope);
		this.listStore = this.container.getTagged<EntityListStore>($EntityView, 'listStore', this.scope);
		this.panelStore = this.container.getTagged<EntityPanelStore>($EntityView, 'panelStore', this.scope);
	}
	//#endregion


	//#region Logic
	public async load() {
		/* If it's not already been initialized, get the configs. */
		await (!this.initialize ? this.loadConfig() : this.initialize);

		const selectedEntity = this.viewStore.selectedEntity.get(this);

		if (!selectedEntity)
			return;

		this.loading = true;

		const data = await this.formApi.load?.({
			entityId: selectedEntity.id,
			view:     this.viewStore,
			list:     this.listStore,
			panel:    this.panelStore,
		}) ?? {};
		const entity: RecordOf = data;
		this.selected = data;
		this.fieldConfig = this.fieldConfig.map(field => ({
			...field, value: entity?.[field.path] ?? '',
		}));

		this.loading = false;
	}

	@watch([ 'apiConfigId', 'fieldConfigId', 'actionConfigId' ])
	public async loadConfig() {
		this.updating = new TrackedPromise(() => {});
		await this.initialize;

		const getPromise = (id: string | undefined, name: string, then: (v: any) => any) => {
			return ifDefined(id,
				v => this.container.getTaggedAsync<any>($EntityView, name, v).then(then));
		};

		this.initialize = Promise.allSettled([
			getPromise(this.apiConfigId, 'formApi', v => this.formApi = clone(v)),
			getPromise(this.fieldConfigId, 'formFields', v => this.fieldConfig = catalogToList(clone(v))),
			getPromise(this.actionConfigId, 'formActions', v => this.actionConfig = catalogToList(clone(v))),
		]);

		await this.initialize;
		this.updating.resolve();
	}

	public override async panelShow() {
		this.formApi.show?.({
			view:  this.viewStore,
			list:  this.listStore,
			panel: this.panelStore,
		});

		await this.loadConfig();
		await this.load();
	}

	public override async panelHide() {
		this.formApi.hide?.({
			view:  this.viewStore,
			list:  this.listStore,
			panel: this.panelStore,
		});

		await this.loadConfig();
	}

	public getEntity() {
		if (!this.selected)
			return;

		const entity = clone<RecordOf>(this.selected);
		this.fieldConfig.forEach(field => entity[field.path] = field.value);

		return entity;
	}

	protected async handleAction(action: EntityView.Panel.Form.Action['handler']) {
		await animateLoading(
			this,
			() => this.spinnerQry,
			async () => action({
				entityId: this.viewStore.selectedEntity.get(this)?.id ?? '',
				fields:   this.fieldConfig,
				form:     this,
				view:     this.viewStore,
				list:     this.listStore,
				panel:    this.panelStore,
			}),
		);
	}
	//#endregion


	//#region Template
	protected override render() {
		return html`
		<div class="base">
			<pl-form .fields=${ this.fieldConfig }></pl-form>

			<section class="actions">
				${ map(this.actionConfig, action => html`
				<pl-button @click=${ () => this.handleAction(action.handler) }>
					${ action.label }
				</pl-button>
				`) }
			</section>
		</div>

		${ when(this.loading, () => html`
		<div class="spinner">
			<pl-spinner></pl-spinner>
		</div>
		`) }
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			height: 100%;
			display: block;
			position: relative;
			overflow: hidden;
		}
		.base {
			height: 100%;
			display: grid;
			grid-template-rows: 1fr auto;
			padding: var(--spacing-m);
			overflow: auto;
		}
		.actions {
			display: flex;
			flex-flow: row nowrap;
			gap: var(--spacing-l);
		}
		.spinner {
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
		'pl-form-panel': FormPanelCmp;
	}
}
