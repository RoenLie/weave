import { provide } from '@roenlie/lit-utilities/context';
import { watch } from '@roenlie/lit-utilities/decorators';
import { $Container, InjectableElement, injectableElement, injectProp } from '@roenlie/lit-utilities/injectable';
import { Container, ContainerModule } from 'inversify';
import { css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { $EntityView } from './entity-context.js';
import { type EntityView } from './entity-view.js';
import { createEntityStoreModule, EntityViewStore } from './entity-view-store.js';


@injectableElement('pl-entity-view')
export class EntityViewCmp extends InjectableElement {

	//#region Properties
	@property()
	@provide('scope')
	public scope?: string = undefined;

	@watch('scope') protected async onScope() {
		if (!this.scope)
			return;

		if (this.storeModule)
			this.container.unload(this.storeModule);

		this.storeModule = createEntityStoreModule(this.scope);
		this.container.load(this.storeModule);

		const viewConfig = await this.container
			.getTaggedAsync<EntityView.Config>($EntityView, 'viewConfig', this.scope);

		const viewStore = this.container.getTagged<EntityViewStore>($EntityView, 'viewStore', this.scope);
		viewStore.viewEl.set(this);
		viewStore.listConfigId.set(viewConfig.listConfigId);
		viewStore.panelConfigId.set(viewConfig.panelConfigId);
	}

	@injectProp($Container) protected container: Container;
	protected storeModule: ContainerModule;
	//#endregion


	//#region Context
	//#endregion


	//#region Lifecycle
	public override async connectedCallback() {
		super.connectedCallback();
	}

	protected override injectionCallback() {
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();
		this.container.unload(this.storeModule);
	}
	//#endregion


	//#region Template
	public override render() {
		if (!this.scope)
			return nothing;

		return html`
		<pl-entity-list></pl-entity-list>
		<pl-entity-panel></pl-entity-panel>
		`;
	}

	public static override styles = [
		css`
		:host {
			position: relative;
			height: 100%;
			width: 100%;
			display: grid;
			grid-template-rows: 1fr;
		}
	`,
	];
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-entity-view': EntityViewCmp;
	}
}
