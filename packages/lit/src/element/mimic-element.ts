import { LitElement } from 'lit';


interface TaggedElementConstructor {
	new(): HTMLElement;
	tagName: string;
}


export const customElement = (tag: string) => (constructor: TaggedElementConstructor) => {
	constructor.tagName = tag.toLowerCase();

	return constructor as any;
};


export class MimicElement extends LitElement {

	public static tagName: string;
	public static register() {
		if (!globalThis.customElements.get(this.tagName))
			globalThis.customElements.define(this.tagName, this);
	}

	/** Is true immediatly after connectedCallback and set to false after the updated hook. */
	#firstUpdateAfterConnected = false;

	/**
	 * Is called on every connection of this element, after on the first updated call.
	 *
	 * This is perfect for performing operations that require the dom to have rendered.
	 *
	 * If it's an operation that only needs to run once, you can use firstConnected.
	 * But for code that must rerun on every reconnection, this is the place.
	 *
	 * @category lifecycle
	 */
	protected afterConnectedCallback(): void { }


	public override connectedCallback(): void {
		super.connectedCallback();

		this.#firstUpdateAfterConnected = true;
	}

	protected override updated(changedProperties: Map<PropertyKey, unknown>): void {
		super.updated(changedProperties);

		if (this.#firstUpdateAfterConnected) {
			this.#firstUpdateAfterConnected = false;
			this.afterConnectedCallback();
		}
	}

}
