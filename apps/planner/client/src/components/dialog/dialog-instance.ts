import { ITrackedPromise, TrackedPromise } from '@roenlie/core/async';
import { Hooks } from '@roenlie/core/coms';
import { domId } from '@roenlie/core/dom';
import { RecordOf } from '@roenlie/core/types';
import { TemplateResult } from 'lit';

import { DialogHooks, IDialogDef, IDialogInstanceCtrl, IDialogPortalCtrl, IDialogProps } from './dialog.types.js';
import { DialogCmp } from './templates/dialog.cmp.js';


/**
 * When an `IDialogPortal` is asked to display an `IDialogDefinition` it creates an instance
 * as a way to track and render the dialog into the DOM. As such it represents the visible dialog.
 */
export class DialogInstance<TResult = any, TCtrl extends RecordOf = RecordOf> {

	/** Will generate an id unless it is provided by the `properties.id`. */
	public get id() { return this.properties.id!; }

	/** The properties are a clone of the properties defined on the dialog which may be modified without modifying the definition. */
	public readonly properties: IDialogProps;

	/** If a parent instance is provided, it will be tracked here. */
	public readonly parent?: DialogInstance;

	public readonly hooks = new Hooks<DialogHooks<TResult>>();

	/** The render function encapsulate the generated controller and provides a template result to be displayed by the portal. */
	public readonly render: (element: DialogCmp) => TemplateResult;

	/** Instances which has this instance as a `parent`. */
	public readonly children: DialogInstance[] = [];

	/** The result promise resolves when a result is provided through the {@link close} action. */
	public get result() { return this.deferredResult; }

	/** The closed promise resolves when the dialog is fully closed, meaning it's close effect has completed. */
	public get closed() { return this.deferredClose; }

	protected readonly deferredResult = new TrackedPromise<TResult | undefined>(resolve => resolve(undefined));
	protected readonly deferredClose: ITrackedPromise<void>;
	protected readonly closeEffect?: () => Promise<void>;

	constructor(options: {
		/** The definition to use as a template for the instance. */
		definition: IDialogDef<TResult, TCtrl>,
		/** The controller generated for the instance. */
		controller: IDialogPortalCtrl,
		/** The optional overrides to apply to the `properties`. */
		overrides?: IDialogProps,
		/** The optional parent instance. */
		parent?: DialogInstance,
		/** The effect to trigger when closing the instance. */
		closeEffect: () => Promise<void>,
	}) {
		this.properties = {
			...options.definition.properties,
			...options.overrides,
		};

		this.properties.id = options.definition.properties.id ?? domId(10, this.properties.name || 'dialog');

		if (this.properties.fullscreen) {
			this.properties.modal = true;

			this.properties.moveable = false;
			this.properties.resizable = false;
			this.properties.maximizable = false;
			this.properties.displaceable = false;

			this.properties.initialXY = [ 0, 0 ];
			this.properties.initialWidth = '100%';
			this.properties.initialHeight = '100%';
		}

		const controller: IDialogInstanceCtrl<TResult, TCtrl> = {
			close:    (result: TResult) => this.close(result),
			instance: this,
			hooks:    this.hooks,
		};
		const controllerCombo = {
			...options.controller,
			...controller,
		};
		const controllerOverrides = options.definition.controller(controllerCombo);

		this.render = (element: DialogCmp) => options.definition.template({
			...controllerCombo,
			...controllerOverrides,
			element,
		});

		this.deferredClose = TrackedPromise.resolve();

		this.parent = options.parent;
		options.parent?.children.push(this);

		this.closeEffect = options.closeEffect;

		this.onOpen();
	}

	/** Close the instance by resolving it with the provided `result`. */
	public async close(result?: TResult): Promise<void> {
		if (this.deferredResult.done)
			return console.error('Attempted to close an already closed dialog!');

		const children = [ ...this.children ].reverse();

		if (this.properties.cascadeRemoval)
			children.forEach(child => child.close());

		this.onClose(result);

		if (this.properties.cascadeRemoval)
			await Promise.allSettled(children.map(child => child.closed));

		await this.onClosed();
	}

	protected onOpen() {
		this.hooks.trigger('open', this);
	}

	protected onClose(result?: TResult) {
		this.hooks.trigger('close', this, result);

		if (this.parent) {
			const childIndex = this.parent.children.indexOf(this);
			this.parent.children.splice(childIndex, 1);
		}

		this.deferredResult.resolve(result);
	}

	protected async onClosed() {
		if (this.closeEffect)
			await this.closeEffect();

		this.hooks.trigger('closed', this);
		this.deferredClose.resolve();
	}

}
