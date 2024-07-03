import { Catalog } from '@roenlie/core/structs';
import { RecordOf } from '@roenlie/core/types';
import { NewUser, newUserEntity } from '@rotul/planner-entities';

import { UserApi } from '../../../app/api/user.js';
import { basicAlert } from '../../../features/alerts/basic-alert.js';
import { confirmDialog } from '../../../features/dialogs/confirm.js';
import { EntityView } from '../../../features/entity-view/entity-view.js';
import { createFormPanel } from '../../../features/entity-view/panel-elements/form-panel.cmp.js';


export const userNewTabConfig: Catalog<object, EntityView.Panel.Tab> = {
	catalog: {
		form: {
			name:     'New User',
			template: () => createFormPanel({
				apiConfig:    'user-new:form-api',
				fieldConfig:  'user-edit:form-fields',
				actionConfig: 'user-new:form-actions',
			}),
		},
	},
	use: {
		form: true,
	},
};


export const configUserNewPanelApi: EntityView.Panel.Api = {
	show: () => { },
	hide: ({ panel }) => {
		panel.panelApiId.set('user-edit:panel-api');
		panel.panelTabId.set('user-edit:panel-tabs');
	},
};


export const configUserNewFormApi: EntityView.Panel.Form.Api = {
	load: async () => {
		return {};
	},
	hide: () => { },
};


export const configUserNewFormActions: Catalog<object, EntityView.Panel.Form.Action> = {
	catalog: {
		submit: {
			name:      'submit',
			label:     'Submit',
			condition: () => true,
			handler:   async ({ fields, form, list, panel }) => {
				const confirm = await confirmDialog('This will insert a new user into the database, continue?');
				if (!confirm)
					return;

				const userEntity: RecordOf<NewUser> = newUserEntity();
				fields.forEach(field => userEntity[field.path] = field.value);

				await UserApi.create(userEntity);

				basicAlert('User was added, rejoice!', 'success');

				panel.panelEl.get().hidePanel();
				form.loadConfig();
				list.listEl.get().load();
			},
		},
	},
	use: {
		submit: true,
	},
};
