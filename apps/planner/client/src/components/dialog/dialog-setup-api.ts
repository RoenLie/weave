import { RecordOf } from '@roenlie/core/types';
import { TemplateResult } from 'lit';

import { DialogCtrl, IDialogDef, IDialogGeneratedCtrl, IDialogPortal, IDialogProps } from './dialog.types.js';


/** Entry point for defining dialog definitions which may be passed to a dialog portal for instantiation. */
export class Dialogs {

	/* Disallow instantiation. This is a static class! */
	private constructor() {}

	/** Start defining a dialog by specifying its properties. */
	public static define<TResult = void>(properties: IDialogProps) {
		return {
			/** Specify functions to use in the template in addition to the standard `IDialogCtrl` functions. */
			controller: <TCtrl extends RecordOf = RecordOf>(controller: (ctrl: IDialogGeneratedCtrl<TResult>) => TCtrl) => {
				return {
					/** Specify the template to use for the dialog content, using the generated controller. */
					template: (template: (ctrl: DialogCtrl<TResult, TCtrl>) => TemplateResult) => this.createDefinition(properties, controller, template),
				};
			},
			/** Specify the template to use for the dialog content, using the standard controller only. */
			template: (template: (ctrl: DialogCtrl<TResult>) => TemplateResult) => this.createDefinition(properties, () => ({}), template),
		};
	}

	private static createDefinition<TResult = void, TCtrl extends RecordOf = RecordOf>(
		properties: IDialogProps,
		controller: (ctrl: IDialogGeneratedCtrl<TResult>) => TCtrl,
		template: (ctrl: DialogCtrl<TResult, TCtrl>) => TemplateResult,
	): IDialogDef<TResult, TCtrl> {
		const def: IDialogDef<TResult> = { properties, controller, template, displayTo: (portal: IDialogPortal, overrides?: IDialogProps) => portal.display(def, overrides) };

		return def;
	}

}
