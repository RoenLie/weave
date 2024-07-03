import { Catalog } from '@roenlie/core/structs';
import { TemplateResult } from 'lit';

import { EntityListStore, EntityPanelStore, EntityViewStore } from './entity-view-store.js';
import { FormPanelCmp } from './panel-elements/form-panel.cmp.js';


export namespace EntityView {
	export interface Config {
		listConfigId: string;
		panelConfigId: string;
	}

	export namespace List {
		export interface Config {
			apiConfigId: string;
			fieldConfigId: string;
			actionConfigId: string;
		}

		type ActionParams = {
			entityId: string,
			fields: EntityView.List.Field[],
			view:   EntityViewStore,
			list:   EntityListStore,
			panel:  EntityPanelStore,
		}

		export interface Action {
			name: string;
			label?: string;
			condition: (params: ActionParams) => Promise<boolean> | boolean;
			handler: (params: ActionParams) => Promise<any>;
		}

		export type ActionCatalog<T extends object = object> = Catalog<T, Action>;

		export interface Field {
			path: string;
			label: string;
			value?: string | number;
			width?: number;
		}

		export type FieldCatalog<T extends object = object> = Catalog<T, Field>;

		export interface Api {
			load: () => Promise<object[]> | object[];
		}
	}

	export namespace Panel {
		export interface Config {
			apiConfigId: string;
			tabConfigId: string;
		}

		export interface Tab {
			name: string;
			template: () => TemplateResult<any>;
		}

		export type TabCatalog<T extends object = object> = Catalog<T, Tab>;

		export interface Api {
			show?: (options: {
				view: EntityViewStore,
				list: EntityListStore,
				panel: EntityPanelStore,
			}) => Promise<void> | void;
			hide?: (options: {
				view: EntityViewStore,
				list: EntityListStore,
				panel: EntityPanelStore,
			}) => Promise<void> | void;
		}

		export namespace Form {
			export interface Config {
				apiConfigId: string;
				fieldConfigId: string;
				actionConfigId: string;
			}

			export interface Field {
				path: string;
				label: string;
				value?: string | number;
				placeholder?: string;
			}

			type ActionParams = {
				entityId: string,
				fields: Field[],
				view:   EntityViewStore,
				list:   EntityListStore,
				panel:  EntityPanelStore,
				form:   FormPanelCmp,
			}

			export interface Action {
				name: string;
				label?: string;
				condition: (params: ActionParams) => Promise<boolean> | boolean;
				handler: (params: ActionParams) => Promise<any>;
			}

			type ApiOptions = {
				view: EntityViewStore,
				list: EntityListStore,
				panel: EntityPanelStore,
			};

			export type Api = {
				load?: (options: { entityId: string } & ApiOptions) => Promise<object> | object;
				show?: (options: ApiOptions) => void;
				hide?: (options: ApiOptions) => void;
			};

			export type ActionCatalog<T extends object = object> = Catalog<T, Action>;

			export type FieldCatalog<T extends object = object> = Catalog<T, Field>;
		}
	}
}
