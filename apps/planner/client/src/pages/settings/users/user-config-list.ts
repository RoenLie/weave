import { User } from '@rotul/planner-entities';

import { UserApi } from '../../../app/api/user.js';
import { EntityView } from '../../../features/entity-view/entity-view.js';


export const userListCatalog: EntityView.List.FieldCatalog<User> = {
	catalog: {
		id: {
			path:  'userId',
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


export const configUserListApi: EntityView.List.Api = {
	load: async () => {
		const [ data ] = await UserApi.getMany();
		if (data === null)
			throw ('No data received during load of users.');

		return data;
	},
};


export const configUserListActions: EntityView.List.ActionCatalog = {
	catalog: {
		new: {
			name:      'new',
			label:     'New',
			condition: ({ panel, list }) => !panel.panelOpen.get(list.listEl.get()),
			handler:   async ({ view, panel }) => {
				view.selectedEntity.set(undefined);
				panel.panelApiId.set('user-new:panel-api');
				panel.panelTabId.set('user-new:panel-tabs');

				await panel.panelEl.get().configLoading;
				panel.panelEl.get().showPanel();
			},
		},
	},
	use: {
		new: true,
	},
};
