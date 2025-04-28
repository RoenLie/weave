import { type PromiseOrFunc, resolvablePromise, resolvePromiseOrFunc } from '@roenlie/core/async';
import { isClass, typeOf } from '@roenlie/core/validation';
import { useReflectMetadata } from '@roenlie/reflect-metadata';
import { adoptStyles, type CSSResultOrNative, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';

import type { Adapter } from '../adapter/adapter.js';
import { injectable } from '../annotations/annotations.js';
import type { ContainerModule } from '../container/container-module.js';
import { ContainerLoader } from '../container/loader.js';
import { AegisElement } from './aegis-element.js';


type Modules = PromiseOrFunc<ContainerModule | PromiseOrFunc<ContainerModule>[]>;


export let currentAdapterElement: AegisComponent | undefined;


export class AegisComponent extends AegisElement {

	static { useReflectMetadata(); }

	/** True if this component has loaded its modules,
	 * meaning they will not be loaded again. */
	static modulesResolved = false;

	/** Allows supplying css as a prop which will be added to the components styles. */
	@property({ type: String }) sheet: string;
	protected readonly _sheet = new CSSStyleSheet();

	protected readonly adapterId:   string | symbol = this.localName;
	protected readonly adapterCtor: typeof Adapter;
	protected readonly modules:     Modules;
	protected adapter:              Adapter;
	protected adapterResolved = resolvablePromise();

	protected constructor(
		adapterCtor?: (() => typeof Adapter<any>) | typeof Adapter<any>,
		modules: Modules = [],
	) {
		super();

		if (adapterCtor) {
			if (typeOf.function(adapterCtor) && !isClass(adapterCtor))
				adapterCtor = adapterCtor();

			injectable()(adapterCtor);
			this.adapterCtor = adapterCtor;
		}

		this.modules = modules;
	}

	override connectedCallback(): void {
		super.connectedCallback();
		this.containerConnectedCallback();
	}

	async containerConnectedCallback(): Promise<void> {
		if (this.hasUpdated)
			return this.adapter?.connectedCallback?.();

		if (this.adapterResolved.done)
			this.adapterResolved = resolvablePromise();

		const elementBase = this.constructor as typeof AegisComponent;
		if (!elementBase.modulesResolved) {
			elementBase.modulesResolved = true;

			const promise = resolvablePromise();
			ContainerLoader.addToLoadingQueue(promise);

			let modules = await resolvePromiseOrFunc(this.modules);
			if (!Array.isArray(modules))
				modules = [ modules ];

			const resolvedModules = await Promise
				.all(modules.map(async module => resolvePromiseOrFunc(module)));

			ContainerLoader.load(...resolvedModules);
			ContainerLoader.removeFromLoadingQueue(promise);

			promise.resolve();
		}

		await ContainerLoader.waitForQueue();

		// If there is a supplied adapter and no adapter currently bound.
		// resolve the supplied adapter through the container.
		const adapterCtor = !ContainerLoader.isBound(this.adapterId) && this.adapterCtor
			? this.adapterCtor
			: await ContainerLoader.getAsync<typeof Adapter>(this.adapterId);

		// Binds current element to be picked up by adapter constructor
		currentAdapterElement = this as any;

		this.adapter = ContainerLoader.resolve<Adapter>(adapterCtor);

		// Unbind current element so no other adapters get this element.
		currentAdapterElement = undefined;

		const adapterBase = this.adapter.constructor as typeof Adapter;
		if (this.shadowRoot) {
			const styles = ensureArray(adapterBase.styles);
			const baseStyles = ensureArray(elementBase.styles);

			adoptStyles(this.shadowRoot,
				[ ...baseStyles, ...styles, this._sheet ] as CSSResultOrNative[]);
		}

		this.adapterResolved.resolve();
		this.adapter?.connectedCallback?.();
	}

	protected scheduledUpdate?: Promise<any>;
	protected override scheduleUpdate(): void | Promise<unknown> {
		if (this.scheduledUpdate)
			return this.scheduledUpdate;

		if (!this.adapterResolved.done) {
			this.scheduledUpdate = this.adapterResolved.then(() => {
				this.scheduledUpdate = undefined;
				super.scheduleUpdate();
			});

			return this.scheduledUpdate;
		}

		super.scheduleUpdate();
	}

	override afterConnectedCallback(): void {
		this.adapter?.afterConnectedCallback?.();
	}

	override disconnectedCallback(): void {
		// Called before super to allow code to run prior to element being removed.
		this.adapter?.disconnectedCallback?.();
		super.disconnectedCallback();
	}

	protected override firstUpdated(changedProps: PropertyValues): void {
		super.firstUpdated(changedProps);
		this.adapter.firstUpdated?.(changedProps);
	}

	protected override willUpdate(changedProps: PropertyValues): void {
		super.willUpdate(changedProps);

		if (changedProps.has('sheet'))
			this._sheet.replaceSync(this.sheet);

		this.adapter?.willUpdate?.(changedProps);
	}

	protected override update(changedProps: PropertyValues): void {
		super.update(changedProps);
		this.adapter?.update?.(changedProps);
	}

	protected override updated(changedProps: PropertyValues): void {
		super.updated(changedProps);
		this.adapter?.updated?.(changedProps);
	}

	protected override render(): unknown {
		return this.adapter.render?.();
	}

}


const ensureArray = <T>(possibleArray?: T): T[] => {
	return possibleArray
		? Array.isArray(possibleArray) ? possibleArray
			: [ possibleArray ]
		: [];
};
