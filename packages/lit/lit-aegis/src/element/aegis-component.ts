import { resolvablePromise, resolvePromiseOrFunc, type PromiseOrFunc } from '@roenlie/core/async';
import { adoptStyles, type CSSResultOrNative, type PropertyValues } from 'lit';

import type { Adapter } from '../adapter/adapter.js';
import { injectable } from '../annotations/annotations.js';
import type { ContainerModule } from '../container/container-module.js';
import { ContainerLoader } from '../container/loader.js';
import { AegisElement } from './aegis-element.js';
import { typeOf } from '@roenlie/core/validation';
import { property } from 'lit/decorators.js';


type Modules = PromiseOrFunc<ContainerModule | PromiseOrFunc<ContainerModule>[]>;


export let currentAdapterElement: AegisComponent | undefined;


export class AegisComponent extends AegisElement {

	/** True if this component has loaded its modules,
	 * meaning they will not be loaded again. */
	public static modulesResolved = false;

	/** Allows supplying css as a prop which will be added to the components styles. */
	@property({ type: String }) public sheet: string;
	protected _sheet = new CSSStyleSheet();

	protected readonly adapterId:   string | symbol = this.localName;
	protected readonly adapterCtor: typeof Adapter;
	protected readonly modules:     Modules;
	protected adapter:              Adapter;

	protected constructor(
		adapterCtor: (() => typeof Adapter) | typeof Adapter,
		modules: Modules = [],
	) {
		super();

		if (typeOf.function(adapterCtor))
			adapterCtor = adapterCtor();

		injectable()(adapterCtor);
		this.adapterCtor = adapterCtor;
		this.modules = modules;
	}

	public override connectedCallback(): void {
		super.connectedCallback();

		this.containerConnectedCallback();

		ContainerLoader.waitForQueue().then(() =>
			this.adapter?.connectedCallback?.());
	}

	public async containerConnectedCallback(): Promise<void> {
		if (this.hasUpdated)
			return;

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

		const adapterBase = this.adapter.constructor as typeof Adapter;
		if (this.shadowRoot) {
			const styles = ensureArray(adapterBase.styles);
			const baseStyles =  ensureArray(elementBase.styles);

			adoptStyles(this.shadowRoot,
				[ ...baseStyles, ...styles, this._sheet ] as CSSResultOrNative[]);
		}
	}

	protected override scheduleUpdate(): void | Promise<unknown> {
		if (ContainerLoader.loadingQueue.length) {
			return ContainerLoader.waitForQueue()
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
