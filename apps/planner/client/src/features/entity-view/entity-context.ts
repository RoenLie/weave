import { EntityListStore, EntityPanelStore, EntityViewStore } from './entity-view-store.js';


export interface EntityContext {
	viewStore: EntityViewStore;
	listStore: EntityListStore;
	panelStore: EntityPanelStore;
}


export const $EntityView = Symbol('EntityView');
