import { Hooks } from '@roenlie/core/coms';
import { Localize } from '@roenlie/core/localize';
import { RecordOf } from '@roenlie/core/types';
import type { TemplateResult } from 'lit';

import type { Coordinates, IConstraints } from './controllers/controller.types.js';
import type { DialogInstance } from './dialog-instance.js';
import type { DialogCmp } from './templates/dialog.cmp.js';


/** The properties of a dialog. */
export interface IDialogProps extends Record<string, any> {
	name?: string;
	id?: string;
	initialXY?: Coordinates;
	moveable?: boolean;
	resizable?: boolean;
	maximizable?: boolean;
	displaceable?: boolean;
	cancellable?: boolean;
	modal?: boolean;
	fullscreen?: boolean;
	initialWidth?: string;
	initialHeight?: string;
	constraints?: IConstraints;
	cascadeRemoval?: boolean;
}


/** The dialog controller part for displaying into an `IDialogPortal`. */
export interface IDialogPortalCtrl {
	/** Provides localization within the dialog. */
	localize: Localize;

	/** Create and display the dialog `definition` as a child dialog of controlled dialog. */
	display<
		TChildResult,
		TChildCtrl extends RecordOf = RecordOf
	>(
		definition: IDialogDef<TChildResult, TChildCtrl>,
		overrides?: IDialogProps
	): DialogInstance<TChildResult>;
}


/** The dialog controller part containing functionality connected to the dialog instance. */
export interface IDialogInstanceCtrl<TResult, TCtrl extends RecordOf = RecordOf> {
	/** Close and resolve the instance with the provided `result`. */
	close(result?: TResult): void;

	/** Provides a way to add handlers to `DialogHooks`. */
	readonly hooks: Hooks<DialogHooks<TResult>>;

	/** The instance controlled by the controller. */
	readonly instance: DialogInstance<TResult, TCtrl>;
}


/** The combination of all of the dialog controller parts, including the `TCtrl` created by the consumer using the dialog setup api. */
export interface IDialogGeneratedCtrl<
	TResult,
	TCtrl extends RecordOf = RecordOf
> extends IDialogPortalCtrl, IDialogInstanceCtrl<TResult, TCtrl> {}


/** The fully realized controller, containing all of the dialog parts, including the `TCtrl` created by the consumer using the dialog setup api. */
export type DialogCtrl<
	TResult,
	TCtrl extends RecordOf = RecordOf
> = IDialogGeneratedCtrl<TResult> & TCtrl & {
	/** The wrapper element which renders the dialog content. */
	element: DialogCmp,
};


/** The dialog definition is a reusable template which can be turned into a `DialogInstance` in a dialog portal. */
export interface IDialogDef<TResult, TCtrl extends RecordOf = RecordOf> {
	/** The properties defines how the dialog should be displayed; it's placement, dimensions etc. */
	properties: IDialogProps;

	/**
	 * The controller knows how to generate features in addition to what the `IDialogCtrl`
	 * provides which can be used by the `template`.
	 */
	controller: (ctrl: IDialogGeneratedCtrl<TResult>) => TCtrl;

	/** The template knows how to generate a `TemplateResult` based on the `ctrl`. */
	template: (ctrl: DialogCtrl<TResult, TCtrl>) => TemplateResult;

	/**
	 * Display the definition to the `portal`.
	 * @remarks Syntactic sugar over `IDialogPortal.display` which allows us to invert the call flow when convenient.
	 */
	displayTo(portal: IDialogPortal, overrides?: IDialogProps): DialogInstance<TResult>;
}


/**
 * A portal is an area in the DOM into which you may display/render your dialogs.
 *
 * It knows how to turn a dialog definition into an instance and render it.
 */
export interface IDialogPortal {
	/**
	 * Get the existing dialog instance with the provided `id` if it exists.
	 */
	get<TResult = any, TCtrl extends RecordOf = RecordOf>(
		id: string
	): DialogInstance<TResult, TCtrl> | undefined;

	/**
	 * Create and display a `DialogInstance` from the provided `definition`.
	 * @param dialog The dialog definition to describing the basis of the dialog.
	 * @param overrides Property overrides to use instead of the corresponding `dialog.properties` for the instance.
	 */
	display<TResult, TCtrl extends RecordOf = RecordOf>(
		dialog: IDialogDef<TResult, TCtrl>, overrides?: IDialogProps
	): DialogInstance<TResult>;

	/** Provides a way to add handlers to `DialogHooks`. */
	readonly hooks: Hooks<DialogHooks<any>>;
}


/** Hooks for use with dialogs. */
export type DialogHooks<TResult = any> = {
	open: (instance: DialogInstance<TResult>) => void,
	close: (instance: DialogInstance<TResult>, result: TResult | undefined) => void,
	closed: (instance: DialogInstance<TResult>) => void,
}
