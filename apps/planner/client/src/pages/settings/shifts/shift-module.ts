
import { ContainerModule } from '@roenlie/lit-utilities/injectable';

import { $EntityView } from '../../../features/entity-view/entity-context.js';


export const shiftSettingsModule = new ContainerModule(({ bind }) => {
	const bindTo = (name: string, value: string, importFn: () => Promise<any>) =>
		void bind($EntityView).toDynamicValue(importFn).inSingletonScope().whenTargetTagged(name, value);

	bindTo('viewConfig',  'shift:view-config',  () => import('./shift-config.js').then(m => m.shiftViewConfig));
	bindTo('listConfig',  'shift:list-config',  () => import('./shift-config.js').then(m => m.shiftListConfig));
	bindTo('panelConfig', 'shift:panel-config', () => import('./shift-config.js').then(m => m.shiftPanelConfig));

	bindTo('listApi',     'shift:list-api',     () => import('./shift-config.js').then(m => m.shiftListApi));
	bindTo('listFields',  'shift:list-fields',  () => import('./shift-config.js').then(m => m.shiftListCatalog));
	bindTo('listActions', 'shift:list-actions', () => import('./shift-config.js').then(m => m.shiftListActions));

	bindTo('panelApi',    'shift:panel-api',    () => import('./shift-config.js').then(m => m.shiftPanelApi));
	bindTo('panelTabs',   'shift:panel-tabs',   () => import('./shift-config.js').then(m => m.shiftTabConfig));
	//bindTo('formApi',     'user-new:form-api',      () => import('./user-config-new.js').then(m => m.configUserNewFormApi));
	//bindTo('formActions', 'user-new:form-actions',  () => import('./user-config-new.js').then(m => m.configUserNewFormActions));


	//bindTo('panelApi',    'user-edit:panel-api',    () => import('./user-config-edit.js').then(m => m.panelApi));
	//bindTo('panelTabs',   'user-edit:panel-tabs',   () => import('./user-config-edit.js').then(m => m.userTabConfig));
	//bindTo('formApi',     'user-edit:form-api',     () => import('./user-config-edit.js').then(m => m.configUserEditFormApi));
	//bindTo('formFields',  'user-edit:form-fields',  () => import('./user-config-edit.js').then(m => m.userFormCatalog));
	//bindTo('formActions', 'user-edit:form-actions', () => import('./user-config-edit.js').then(m => m.configUserEditFormActions));
});
