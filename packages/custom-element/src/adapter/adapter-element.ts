import type { Writeable } from '@roenlie/core/types';
import { render, type RenderOptions } from 'lit-html';

import { effect } from '../shared/effect.ts';
import type { ReactiveController, ReactiveControllerHost } from '../shared/reactive-controller.ts';
import type { CSSStyle } from './helpers.ts';
import { getFlatStyles, getPrototypeChain } from './helpers.ts';
import type { AdapterMetadata } from './types.ts';


// Ensure metadata is enabled. TypeScript does not polyfill
// Symbol.metadata, so we must ensure that it exists.
(Symbol as { metadata: symbol; }).metadata ??= Symbol('metadata');


export class AdapterBase extends HTMLElement {

	protected static adapter: typeof AdapterElement;
	static override [Symbol.hasInstance](value: object): boolean {
		return value instanceof this.adapter;
	}

	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		this.renderRoot = this.shadowRoot ?? this;
	}

	renderRoot: ShadowRoot | HTMLElement;

	protected __adapter:  AdapterElement | undefined;
	protected __attrCtrl: MutationObserver | undefined;

	protected connectedCallback(): void { this.connectAdapter(); }
	protected disconnectedCallback(): void { this.disconnectAdapter(); }

	protected connectAdapter(): void {
		const base = this.constructor as any as typeof AdapterBase;
		const metadata = base.adapter.metadata;

		if (!this.__adapter) {
			for (const { propName } of Object.values(metadata.propertyMetadata)) {
				Object.defineProperty(this, propName, {
					get() {
						return this.adapter![propName as keyof AdapterElement];
					},
					set(value) {
						this.adapter![propName as keyof AdapterElement] = value;
					},
				});
			}

			const protoChain = getPrototypeChain(base.adapter);
			metadata.styles = getFlatStyles('styles', protoChain);

			this.shadowRoot!.adoptedStyleSheets = metadata.styles;

			if (metadata.observedAttributes)
				this.__attrCtrl = new MutationObserver(this.observeAttributes.bind(this));

			this.__adapter = new base.adapter();
			(this.__adapter as any).__element = new WeakRef(this);
		}

		// Set the initial values of the attribute properties.
		metadata.observedAttributes?.forEach(attr => {
			if (!this.hasAttribute(attr))
				return;

			const value = this.getAttribute(attr) ?? '';
			this.attributeChanged(attr, value);
		});

		// Observe the attributes for changes.
		this.__attrCtrl?.observe(this, {
			attributes:      true,
			attributeFilter: metadata.observedAttributes,
		});

		// If this is the first time the adapter has connected,
		// call the firstConnected method.
		if (!this.__adapter.hasConnected)
			this.__adapter.firstConnected();

		// Call the connected method on the adapter.
		this.__adapter.connected();
	}

	protected disconnectAdapter(): void {
		// First clean up anything that may react to changes.
		this.__attrCtrl?.disconnect();

		// Then clean up the adapter.
		this.__adapter?.disconnected();
	}

	protected observeAttributes(entries: MutationRecord[]): void {
		entries.forEach(entry => {
			const name = entry.attributeName;
			if (!name)
				return;

			const target = entry.target as HTMLElement;
			if (!(target instanceof HTMLElement))
				return;

			this.attributeChanged(
				name,
				target.getAttribute(entry.attributeName)!,
			);
		});
	};

	protected attributeChanged(name: string, value: string): void {
		const base = this.constructor as any as typeof AdapterBase;
		const metadata = base.adapter.metadata;

		const propMeta = metadata.propertyMetadata?.[name];
		if (!propMeta)
			return console.warn(`Unknown attribute: ${ name }`);

		const adapter = this.__adapter;
		if (!adapter)
			return;

		const type = propMeta.type;
		let convertedValue: any;

		if (type === Boolean)
			convertedValue = value === 'true' || value === '' || false;
		else if (type === String)
			convertedValue = value || '';
		else if (type === Number)
			convertedValue = Number(value);
		else if (type === Object)
			convertedValue = JSON.parse(value);

		convertedValue = convertedValue ?? undefined;

		if (adapter[propMeta.propName as keyof AdapterElement] !== convertedValue)
			(adapter as any)[propMeta.propName] = convertedValue;
	}

}


export class AdapterElement implements ReactiveControllerHost {

	static tagName: string;
	static register(): void {
		if (globalThis.customElements.get(this.tagName))
			return;

		const adapter = this;
		const cls = class extends AdapterBase {

			protected static override adapter = adapter;

		};

		Object.defineProperty(cls, 'name', {
			value: this.tagName.replaceAll('-', '_'),
		});

		globalThis.customElements.define(this.tagName, cls);
	}

	declare static [Symbol.metadata]: AdapterMetadata;
	static get metadata(): AdapterMetadata {
		const metadata = (this[Symbol.metadata] ??= {} as any);
		metadata.observedAttributes ??= [];
		metadata.propertyMetadata   ??= {};
		metadata.signalProps        ??= [];
		metadata.changedProps       ??= new Set();
		metadata.previousProps      ??= new Map();

		return metadata;
	}

	/**
	 * A weak reference to the AdapterProxy element that is managing this adapter.\
	 * This is used to avoid potential memory leaks from locking a direct reference.\
	 * For internal use only.
	 */
	private __element:        WeakRef<AdapterBase>;
	private __unsubEffect?:   () => void;
	private __resolveUpdate?: (bool: true) => void;
	private __controllers:    Set<ReactiveController> = new Set();

	readonly hasConnected:   boolean = false;
	readonly hasUpdated:     boolean = false;
	readonly updateComplete: Promise<boolean> = Promise.resolve(true);

	protected renderOptions?: RenderOptions;

	//#region Component-lifecycle

	/** Called first time this instance of the element is connected to the DOM. */
	firstConnected(): void {
		(this.hasConnected as boolean) = true;
	}

	/** Called everytime this instnace of the element is connected to the DOM. */
	connected(): void {
		// We utilize a WeakRef to avoid a potential leak from
		// locking a direct reference to the instance in this scope.
		const ref = new WeakRef(this);

		// eslint-disable-next-line prefer-arrow-callback
		this.__unsubEffect = effect(function() {
			// We use a function to prevent `this` from the class from being captured.
			ref.deref()?.requestUpdate();
		});
	}

	/** Called after a setTimeout of 0 after the render method. */
	afterConnected(): void {
	}

	disconnected(): void {
		this.__unsubEffect?.();
	}

	protected beforeUpdate(changedProps: Set<string | symbol>): void {
		for (const controller of this.__controllers)
			controller.hostUpdate?.();
	}

	protected render(): unknown {
		return;
	};

	protected afterUpdate(changedProps: Set<string | symbol>): void {
		for (const controller of this.__controllers)
			controller.hostUpdated?.();
	}
	//#endregion

	protected __populateChangedProps(): void {
		const base = this.constructor as any as typeof AdapterElement;
		const metadata = base.metadata;

		for (const prop of metadata.signalProps ?? []) {
			const value = this[prop as keyof typeof this];

			if (metadata.previousProps.get(prop) !== value)
				metadata.changedProps.add(prop);

			metadata.previousProps.set(prop, value);
		}
	}

	protected __setPendingUpdate(): void {
		const { promise, resolve } = Promise.withResolvers<boolean>();
		(this as Writeable<this>).updateComplete = promise;
		this.__resolveUpdate = resolve;
	}

	protected __performUpdate(): void {
		if (this.__resolveUpdate)
			throw new Error('Cannot force update while another update is pending.');

		const base = this.constructor as any as typeof AdapterElement;
		const metadata = base.metadata;

		this.beforeUpdate(metadata.changedProps);

		render(
			this.render(),
			this.__element.deref()!.renderRoot,
			this.renderOptions ?? { host: this },
		);

		// We need to wait for the next frame to ensure the DOM has been updated.
		setTimeout(() => {
			this.afterUpdate(metadata.changedProps);
			metadata.changedProps.clear();

			if (!this.hasUpdated) {
				(this.hasUpdated as boolean) = true;
				this.afterConnected();
			}

			// Resolve the promise and clear the resolve function.
			this.__resolveUpdate = void this.__resolveUpdate?.(true);
		});
	}

	static styles: CSSStyle;


	//#region Consumer API
	addController(controller: ReactiveController): void {
		this.__controllers.add(controller);

		if (this.hasConnected)
			controller.hostConnected?.();
	}

	removeController(controller: ReactiveController): void {
		this.__controllers.delete(controller);
	}

	/** Queues up a render to be performed on the next microtask. */
	requestUpdate(): Promise<boolean> {
		this.__populateChangedProps();

		if (this.__resolveUpdate)
			return this.updateComplete;

		this.__setPendingUpdate();

		queueMicrotask(() => this.__performUpdate());

		return this.updateComplete;
	}

	/** Immediatly performs a render as long as there is not a render already pending. */
	performUpdate(): Promise<boolean> {
		this.__populateChangedProps();

		if (this.__resolveUpdate)
			return this.updateComplete;

		this.__setPendingUpdate();
		this.__performUpdate();

		return this.updateComplete;
	}

	query<T extends HTMLElement>(selector: string): T | undefined {
		const root = this.__element.deref()?.renderRoot;

		return root?.querySelector(selector) ?? undefined;
	}

	queryAll<T extends HTMLElement>(selector: string): T[] {
		const root = this.__element.deref()?.renderRoot;
		if (!root)
			return [];

		return [ ...root.querySelectorAll<T>(selector) ];
	}
	//#endregion


	//#region HTMLElement interfaces
	get classList(): HTMLElement['classList'] {
		const element = this.__element.deref();
		if (!element)
			throw new Error('Element is not defined.');

		return element.classList;
	}

	get querySelector(): HTMLElement['querySelector'] {
		const element = this.__element.deref();
		if (!element)
			throw new Error('Element is not defined.');

		return element.querySelector.bind(element);
	}
	//#endregion

}
