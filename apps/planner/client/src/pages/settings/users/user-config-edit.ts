import { type User } from '@rotul/planner-entities';

import { UserApi } from '../../../app/api/user.js';
import { basicAlert } from '../../../features/alerts/basic-alert.js';
import { confirmDialog } from '../../../features/dialogs/confirm.js';
import { type EntityView } from '../../../features/entity-view/entity-view.js';
import { createFormPanel } from '../../../features/entity-view/panel-elements/form-panel.cmp.js';
import { createJournalPanel } from '../../../features/entity-view/panel-elements/journal-panel.cmp.js';


export const userViewConfig: EntityView.Config = {
	listConfigId:  'user:list-config',
	panelConfigId: 'user:panel-config',
};


export const userListConfig: EntityView.List.Config = {
	apiConfigId:    'user:list-api',
	fieldConfigId:  'user:list-fields',
	actionConfigId: 'user:list-actions',
};


export const userPanelConfig: EntityView.Panel.Config = {
	apiConfigId: 'user-edit:panel-api',
	tabConfigId: 'user-edit:panel-tabs',
};


export const panelApi: EntityView.Panel.Api = {
	show: () => { },
	hide: () => { },
};


export const userTabConfig: EntityView.Panel.TabCatalog<object> = {
	catalog: {
		form: {
			name:     'User',
			template: () => createFormPanel({
				apiConfig:    'user-edit:form-api',
				fieldConfig:  'user-edit:form-fields',
				actionConfig: 'user-edit:form-actions',
			}),
		},
		journal: {
			name:     'Journal',
			template: () => createJournalPanel({
				apiConfig: 'user-edit:journal-api',
			}),
		},
	},
	use: {
		form:    true,
		journal: true,
	},
};


export const userFormCatalog: EntityView.Panel.Form.FieldCatalog<User> = {
	catalog: {
		id: {
			path:  'id',
			label: 'User ID',
			value: '',
		},
		username: {
			path:  'username',
			label: 'Username',
			value: '',
		},
		firstname: {
			path:  'firstname',
			label: 'Firstname',
			value: '',
		},
		middlename: {
			path:  'middlename',
			label: 'Middlename',
			value: '',
		},
		lastname: {
			path:  'lastname',
			label: 'Lastname',
			value: '',
		},
		title: {
			path:  'title',
			label: 'Title',
			value: '',
		},
		department: {
			path:  'department',
			label: 'Department',
			value: '',
		},
		company: {
			path:  'company',
			label: 'Company',
			value: '',
		},
		email: {
			path:  'email',
			label: 'Email',
			value: '',
		},
		shift: {
			path:  'shift',
			label: 'Shift',
			value: '',
		},
	},
	use: {
		id:         false,
		firstname:  true,
		middlename: true,
		lastname:   true,
		department: true,
		company:    true,
		username:   true,
		email:      true,
		title:      true,
		shift:      true,
	},
};


export const configUserEditFormApi: EntityView.Panel.Form.Api = {
	load: async ({ entityId }) => {
		const [ data ] = await UserApi.get(entityId);
		if (!data)
			throw ('No data received during load of user.');

		return data;
	},
	show: () => { },
	hide: () => { },
};


export const configUserEditFormActions: EntityView.Panel.Form.ActionCatalog<object> = {
	catalog: {
		save: {
			name:      'save',
			label:     'Save',
			condition: () => true,
			handler:   async ({ form, list }) => {
				const [ data, error ] = await UserApi.update(form.getEntity()!);
				if (data) {
					await form.load();

					basicAlert('User updated!', 'primary');
				}
				else if (error) {
					basicAlert(error, 'error');
				}

				list.listEl.get().load();
			},
		},
		delete: {
			name:      'delete',
			label:     'Delete',
			condition: () => true,
			handler:   async ({ entityId, panel, list }) => {
				const confirm = await confirmDialog('This will remove the user from the database, continue?');
				if (!confirm)
					return;

				const [ data ] = await UserApi.delete(entityId);
				if (data !== null)
					basicAlert('User was removed!', 'error');

				panel.panelEl.get().hidePanel();
				list.listEl.get().load();
			},
		},
	},
	use: {
		delete: 10,
		save:   20,
	},
};
