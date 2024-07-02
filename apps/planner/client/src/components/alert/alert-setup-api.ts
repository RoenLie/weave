import { TemplateResult } from 'lit';

import { AlertCmp } from './alert.cmp.js';


export interface IAlertDefinition {
	properties: IAlertProps;
	template: (alert: AlertCmp) => TemplateResult<any> | unknown;
	displayTo: (portal: IAlertPortal) => void;
}


export interface IAlertProps {
	variant?: 'primary' | 'success' | 'neutral' | 'warning' | 'error';
	closeable?: boolean;
	duration?: number;
}


export interface IAlertPortal {
	display(alert: IAlertDefinition): void;
}


/**
 * Creation methods for alerts, which may then be passed to the alert service for instantiation.
 */
export class Alerts {

	/* Disallow instantiation. This is a static class! */
	private constructor() {}

	public static define(properties: IAlertProps) {
		return {
			template: (template: (alert: AlertCmp) => TemplateResult<any> | unknown) =>
				this.createDefinition(properties, template),
		};
	}

	private static createDefinition(
		properties: IAlertProps,
		template: (alert: AlertCmp) => TemplateResult<any> | unknown,
	): IAlertDefinition {
		const def = {
			properties,
			template,
			displayTo: (portal: IAlertPortal) => portal.display(def),
		};

		return def;
	}

}
