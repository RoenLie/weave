import { EntityView } from '../../../features/entity-view/entity-view.js';


export const shiftViewConfig: EntityView.Config = {
	listConfigId:  'shift:list-config',
	panelConfigId: 'shift:panel-config',
};


export const shiftListConfig: EntityView.List.Config = {
	apiConfigId:    'shift:list-api',
	fieldConfigId:  'shift:list-fields',
	actionConfigId: 'shift:list-actions',
};


export const shiftPanelConfig: EntityView.Panel.Config = {
	apiConfigId: 'shift:panel-api',
	tabConfigId: 'shift:panel-tabs',
};


export const shiftPanelApi: EntityView.Panel.Api = {
	show: () => { },
	hide: () => { },
};


export const shiftTabConfig: EntityView.Panel.TabCatalog<object> = {
	catalog: {
	},
	use: {
	},
};


export const shiftListCatalog: EntityView.Panel.Form.FieldCatalog<object> = {
	catalog: {
	},
	use: {
	},
};


export const shiftListApi: EntityView.List.Api = {
	load: async () => {
		console.log('loading!');

		return [];
		//const [ data ] = await UserApi.getMany();
		//if (data === null)
		//	throw ('No data received during load of users.');

		//return data;
	},
};


export const shiftListActions: EntityView.List.ActionCatalog = {
	catalog: {
		clicker: {
			name:      'clicker',
			label:     'Clicker',
			condition: () => true,
			handler:   async () => {
				console.log('clicking');
			},
		},

		//new: {
		//	name:      'new',
		//	label:     'New',
		//	condition: ({ panel, list }) => !panel.panelOpen.get(list.listEl.get()),
		//	handler:   async ({ view, panel }) => {
		//		view.selectedEntity.set(undefined);
		//		panel.panelApiId.set('user-new:panel-api');
		//		panel.panelTabId.set('user-new:panel-tabs');

		//		await panel.panelEl.get().configLoading;
		//		panel.panelEl.get().showPanel();
		//	},
		//},
	},
	use: {
		clicker: true,
	},
};
