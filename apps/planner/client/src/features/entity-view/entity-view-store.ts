import { RecordOf } from '@roenlie/core/types';
import { ContainerModule } from '@roenlie/lit-utilities/injectable';
import { LitStateStore, type Stored, stored } from '@roenlie/lit-utilities/state-store';
import { injectable } from 'inversify';

import { $EntityView } from './entity-context.js';
import { EntityListCmp } from './entity-list.cmp.js';
import { EntityPanelCmp } from './entity-panel.cmp.js';
import { EntityViewCmp } from './entity-view.cmp.js';


@injectable()
export class EntityViewStore extends LitStateStore {

	@stored({ value: {} }) public viewEl: Stored<EntityViewCmp>;
	@stored({ value: '' }) public listConfigId: Stored<string | undefined>;
	@stored({ value: '' }) public panelConfigId: Stored<string | undefined>;
	@stored({ value: '' }) public selectedEntity: Stored<RecordOf<{id: string}> | undefined>;

}


@injectable()
export class EntityListStore extends LitStateStore {

	@stored({ value: {} }) public listEl: Stored<EntityListCmp>;
	@stored({ value: '' }) public listApiId: Stored<string>;
	@stored({ value: '' }) public listFieldId: Stored<string>;
	@stored({ value: '' }) public listActionId: Stored<string>;

}


@injectable()
export class EntityPanelStore extends LitStateStore {

	@stored({ value: {} }) public panelEl: Stored<EntityPanelCmp>;
	@stored({ value: '' }) public panelApiId: Stored<string>;
	@stored({ value: '' }) public panelTabId: Stored<string>;
	@stored({ value: false }) public panelOpen: Stored<boolean>;

}


export const createEntityStoreModule = (scope: string) => {
	return new ContainerModule(({ bind }) => {
		bind($EntityView).to(EntityViewStore).inSingletonScope().whenTargetTagged('viewStore', scope);
		bind($EntityView).to(EntityListStore).inSingletonScope().whenTargetTagged('listStore', scope);
		bind($EntityView).to(EntityPanelStore).inSingletonScope().whenTargetTagged('panelStore', scope);
	});
};
