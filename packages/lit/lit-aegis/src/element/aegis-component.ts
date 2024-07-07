import { resolvablePromise, resolvePromiseOrFunc, type PromiseOrFunc } from '@roenlie/core/async';
import { adoptStyles, type CSSResultOrNative, type PropertyValues } from 'lit';

import type { Adapter } from '../adapter/adapter.js';
import { injectable } from '../annotations/annotations.js';
import type { ContainerModule } from '../container/container-module.js';
import { ContainerLoader } from '../container/loader.js';
import { AegisElement } from './aegis-element.js';
import { typeOf } from '@roenlie/core/validation';


type Modules = PromiseOrFunc<ContainerModule | PromiseOrFunc<ContainerModule>[]>;


export let currentAdapterElement: AegisComponent | undefined;


export class AegisComponent extends AegisElement {

	/** Resolves after the containerConnectedCallback has been resolved. */
	public containerConnected = resolvablePromise();

	protected readonly adapterId:   string | symbol = this.localName;
	protected readonly adapterCtor: typeof Adapter;
	protected readonly modules:     Modules;
	protected adapter:              Adapter;

	//protected sheet = new CSSStyleSheet();

	protected constructor(
		adapterCtor: (() => typeof Adapter) | typeof Adapter,
		modules: Modules = [],
	) {
		super();

		if (typeOf.function(adapterCtor))
			adapterCtor = (adapterCtor)();

		injectable()(adapterCtor as unknown as typeof Adapter);
		this.adapterCtor = adapterCtor as typeof Adapter;
		this.modules = modules;
	}

	public override connectedCallback(): void {
		super.connectedCallback();

		this.containerConnectedCallback();
		this.containerConnected.then(() =>
			this.adapter?.connectedCallback?.());
	}

	public async containerConnectedCallback(): Promise<void> {
		if (this.hasUpdated)
			return;

		let modules = await resolvePromiseOrFunc(this.modules);
		if (!Array.isArray(modules))
			modules = [ modules ];

		const resolvedModules = await Promise
			.all(modules.map(async module => resolvePromiseOrFunc(module)));

		ContainerLoader.unload(...resolvedModules);
		ContainerLoader.load(...resolvedModules);

		// Binds current element to be picked up by adapter injector.
		currentAdapterElement = this as any;

		// If there is a supplied adapter and no adapter currently bound.
		// resolve the supplied adapter through the container.
		if (!ContainerLoader.isBound(this.adapterId) && this.adapterCtor)
			this.adapter = ContainerLoader.resolve<Adapter>(this.adapterCtor);
		else
			this.adapter = ContainerLoader.get<Adapter>(this.adapterId);

		// Unbind current element so no other adapters get this element.
		currentAdapterElement = undefined;

		const elementBase = this.constructor as typeof AegisComponent;
		const adapterBase = this.adapter.constructor as typeof Adapter;
		if (this.shadowRoot) {
			const styles = resolveArrayable(adapterBase.styles);
			const baseStyles =  resolveArrayable(elementBase.styles);

			adoptStyles(this.shadowRoot,
				[ ...baseStyles, ...styles ] as CSSResultOrNative[]);
		}

		this.containerConnected.resolve();
	}

	protected override scheduleUpdate(): void | Promise<unknown> {
		if (!this.containerConnected.done) {
			return this.containerConnected
				.then(() => super.scheduleUpdate());
		}

		super.scheduleUpdate();
	}

	public override afterConnectedCallback(): void {
		this.adapter?.afterConnectedCallback?.();
	}

	public override disconnectedCallback(): void {
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


const resolveArrayable = <T>(possibleArray?: T): T[] => {
	return possibleArray
		? Array.isArray(possibleArray) ? possibleArray
			: [ possibleArray ]
		: [];
};
