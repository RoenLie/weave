import { LitElement, type PropertyValues } from 'lit';

import type { Ctor } from '../app.types.ts';
import { ReadonlyMap } from '../utilities/readonly-map.ts';


/**
 * This decorator sets the static tagname prop on the component.
 * But does not register the component in the global registry.
 *
 *
 * Must be compatible with Lits customElement decorator parameters.
 * As there are metadata libs that use the supplied tagname to extract data.
 */
export const customElement = (tagname: string, registerOnImport = false) => {
	return <TBase extends Ctor<typeof AppElement>>(base: TBase) => {
		base.tagName = tagname;
		if (registerOnImport)
			queueMicrotask(() => base.register());

		return base;
	};
};


const readonlyMap = new ReadonlyMap();


/**
 * Base class that can be used as a replacement for LitElement.
 *
 * Adds a method for registering the component manually instead of relying
 * on the lit default decorators auto registration.
 */
export class AppElement extends LitElement {

	public static tagName: string;
	public static register(tagName = this.tagName) {
		if (!globalThis.customElements.get(tagName))
			globalThis.customElements.define(tagName, this);
	}

	/** Creates a new instance of element using document.createElement */
	public static create<T extends new() => AppElement>(this: T) {
		return document.createElement((this as any).tagName) as InstanceType<T>;
	}

	/**
	 * Updated on willUpdate lifecycle
	 *
	 * After the updated lifecycle, the map is replaced by an empty `ReadonlyMap` instance,
	 *
	 * preventing any further access to the previous changed properties.
	 */
	public changedProperties: ReadonlyMap<PropertyKey, any> = readonlyMap;

	/** Is true immediatly after connectedCallback and set to false after the first updated hook. */
	firstUpdateAfterConnected = false;

	/**
	 * Is called on every connection of this element, after the first updated hook as been called.
	 *
	 * This is perfect for performing operations that require the dom to have rendered.
	 *
	 * If it's an operation that only needs to run once, you can use firstConnected.
	 * But for code that must rerun on every reconnection, this is the place.
	 *
	 * @category lifecycle
	 */
	public afterConnectedCallback(): void { }

	/**
	 * Lifecycle hook that gets called after super.disconnectedCallback.
	 * This happens after the component has been marked by Lit for dom removal.
	 *
	 * @category lifecycle
	 */
	public afterDisconnectedCallback(): void { }

	public override connectedCallback(): void {
		super.connectedCallback();

		this.firstUpdateAfterConnected = true;
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();

		this.afterDisconnectedCallback();
	}

	protected override willUpdate(changedProperties: PropertyValues): void {
		this.changedProperties = new ReadonlyMap(changedProperties);

		super.willUpdate(changedProperties);
	}

	protected override updated(changedProperties: PropertyValues): void {
		super.updated(changedProperties);

		if (this.firstUpdateAfterConnected) {
			this.firstUpdateAfterConnected = false;
			this.afterConnectedCallback();
		}

		this.changedProperties = readonlyMap;
	}

}
