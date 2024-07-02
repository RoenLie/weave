import { ContainerModule } from '@roenlie/lit-utilities/injectable';

import { $EntityView } from '../../../features/entity-view/entity-context.js';


export const userSettingsModule = new ContainerModule(({ bind }) => {
	const bindTo = (name: string, value: string, importFn: () => Promise<any>) =>
		void bind($EntityView).toDynamicValue(importFn).inSingletonScope().whenTargetTagged(name, value);
	//
	bindTo('viewConfig',  'user:view-config',       () => import('./user-config-edit.js').then(m => m.userViewConfig));
	bindTo('listConfig',  'user:list-config',       () => import('./user-config-edit.js').then(m => m.userListConfig));
	bindTo('panelConfig', 'user:panel-config',      () => import('./user-config-edit.js').then(m => m.userPanelConfig));
	//
	bindTo('listApi',     'user:list-api',          () => import('./user-config-list.js').then(m => m.configUserListApi));
	bindTo('listFields',  'user:list-fields',       () => import('./user-config-list.js').then(m => m.userListCatalog));
	bindTo('listActions', 'user:list-actions',      () => import('./user-config-list.js').then(m => m.configUserListActions));
	//
	bindTo('panelApi',    'user-new:panel-api',     () => import('./user-config-new.js').then(m => m.configUserNewPanelApi));
	bindTo('panelTabs',   'user-new:panel-tabs',    () => import('./user-config-new.js').then(m => m.userNewTabConfig));

	bindTo('formApi',     'user-new:form-api',      () => import('./user-config-new.js').then(m => m.configUserNewFormApi));
	bindTo('formActions', 'user-new:form-actions',  () => import('./user-config-new.js').then(m => m.configUserNewFormActions));
	//
	bindTo('panelApi',    'user-edit:panel-api',    () => import('./user-config-edit.js').then(m => m.panelApi));
	bindTo('panelTabs',   'user-edit:panel-tabs',   () => import('./user-config-edit.js').then(m => m.userTabConfig));

	bindTo('formApi',     'user-edit:form-api',     () => import('./user-config-edit.js').then(m => m.configUserEditFormApi));
	bindTo('formFields',  'user-edit:form-fields',  () => import('./user-config-edit.js').then(m => m.userFormCatalog));
	bindTo('formActions', 'user-edit:form-actions', () => import('./user-config-edit.js').then(m => m.configUserEditFormActions));
	//
});
