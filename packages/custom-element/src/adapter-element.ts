import type { Writeable } from '@roenlie/core/types';
import { html, render } from 'lit-html';
import { Signal } from 'signal-polyfill';

import { effect } from './effect.ts';
import { css, type CSSStyle, getFlatStyles, getPrototypeChain } from './helpers.ts';


type PropertyType = StringConstructor | ObjectConstructor | NumberConstructor | BooleanConstructor;
interface AdapterMetadata {
	observedAttributes: string[];
	propertyMetadata:   Record<string, { propName: string; type: PropertyType; reflect: boolean; }>;
	signalProps:        string[];
	changedProps:       Set<string | symbol>;
	previousProps:      Map<string | symbol, any>;
	styles?:            CSSStyleSheet[];
}


// Ensure metadata is enabled. TypeScript does not polyfill
// Symbol.metadata, so we must ensure that it exists.
(Symbol as { metadata: symbol; }).metadata ??= Symbol('metadata');


export const state = () => <C extends AdapterElement, V>(
	target: ClassAccessorDecoratorTarget<C, V>,
	context: ClassAccessorDecoratorContext<C, V>,
): ClassAccessorDecoratorResult<C, V> => {
	const { get } = target;

	const metadata = context.metadata as any as AdapterMetadata;

	metadata.signalProps ??= [];
	const propName = context.name.toString();
	if (!metadata.signalProps.includes(propName))
		metadata.signalProps.push(propName);

	return {
		get() {
			const signal = (get.call(this) as Signal.State<V>);

			return signal.get();
		},
		set(value: V) {
			const signal = (get.call(this) as Signal.State<V>);
			signal.set(value);
		},
		init(value: any): any {
			return new Signal.State(value);
		},
	};
};


export const property = (
	type: PropertyType = String,
	options?: { reflect?: boolean; },
) => <C extends AdapterElement, V>(
	target: ClassAccessorDecoratorTarget<C, V>,
	context: ClassAccessorDecoratorContext<C, V>,
): ClassAccessorDecoratorResult<C, V> => {
	const { get } = target;

	const metadata = context.metadata as any as AdapterMetadata;

	metadata.signalProps ??= [];
	const propName = context.name.toString();
	if (!metadata.signalProps.includes(propName))
		metadata.signalProps.push(propName);

	metadata.observedAttributes ??= [];
	const attrName = propName
		.replace(/([A-Z])/g, '-$1')
		.toLowerCase();

	if (!metadata.observedAttributes.includes(attrName)) {
		metadata.observedAttributes.push(attrName);
		metadata.propertyMetadata ??= {};
		metadata.propertyMetadata[attrName] = {
			propName,
			type,
			reflect: options?.reflect ?? false,
		};
	}

	return {
		get() {
			const signal = (get.call(this) as Signal.State<V>);

			return signal.get();
		},
		set(value: V) {
			const signal = (get.call(this) as Signal.State<V>);
			signal.set(value);

			if (metadata.propertyMetadata[attrName]?.reflect) {
				(this as any as { __element: WeakRef<AdapterProxy>; })
					.__element.deref()
					?.setAttribute(propName, String(value));
			}
		},
		init(value: any): any {
			return new Signal.State(value);
		},
	};
};


class AdapterProxy extends HTMLElement {

	protected static adapter: typeof AdapterElement;
	static override [Symbol.hasInstance](value: object) {
		return value instanceof this.adapter;
	}

	declare ['constructor']: typeof AdapterProxy;
	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		this.renderRoot = this.shadowRoot ?? this;
	}

	protected adapter?: AdapterElement;
	protected attrCtrl: MutationObserver;
	renderRoot:         ShadowRoot | HTMLElement;

	protected connectedCallback(): void { this.connectAdapter(); }
	protected disconnectedCallback(): void { this.disconnectAdapter(); }

	protected connectAdapter() {
		const metadata = this.constructor.adapter.metadata;

		if (!this.adapter) {
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

			const protoChain = getPrototypeChain(this.constructor.adapter);
			metadata.styles = getFlatStyles('styles', protoChain);

			this.shadowRoot!.adoptedStyleSheets = metadata.styles;
			this.attrCtrl = new MutationObserver(this.observeAttributes);

			this.adapter = new this.constructor.adapter();
			(this.adapter as any).__element = new WeakRef(this);
		}

		// Set the initial values of the attribute properties.
		metadata.observedAttributes?.forEach(attr => {
			if (!this.hasAttribute(attr))
				return;

			const value = this.getAttribute(attr) ?? '';
			this.attributeChanged(attr, value);
		});

		// Observe the attributes for changes.
		this.attrCtrl.observe(this, {
			attributes:      true,
			attributeFilter: metadata.observedAttributes,
		});

		// If this is the first time the adapter has connected,
		// call the firstConnected method.
		if (!this.adapter.hasConnected)
			this.adapter.firstConnected();

		// Call the connected method on the adapter.
		this.adapter.connected();
	}

	protected disconnectAdapter() {
		// First clean up anything that may react to changes.
		this.attrCtrl.disconnect();

		// Then clean up the adapter.
		this.adapter?.disconnected();
	}

	protected observeAttributes = (entries: MutationRecord[]): void => {
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

	protected attributeChanged(name: string, value: string) {
		const metadata = this.constructor.adapter.metadata;

		const propMeta = metadata.propertyMetadata?.[name];
		if (!propMeta)
			return console.warn(`Unknown attribute: ${ name }`);

		const adapter = this.adapter;
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


class AdapterElement {

	static tagName: string;
	static register() {
		if (globalThis.customElements.get(this.tagName))
			return;

		const adapter = this;
		window.customElements.define(
			this.tagName,
			class extends AdapterProxy {

				protected static override adapter = adapter;

			},
		);
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

	declare ['constructor']: typeof AdapterElement;
	constructor() {
		this.updateComplete = Promise.resolve(true);
	}

	/**
	 * A weak reference to the AdapterProxy element that is managing this adapter.\
	 * This is used to avoid potential memory leaks from locking a direct reference.\
	 * For internal use only.
	 */
	private __element:        WeakRef<AdapterProxy>;
	private __unsubEffect?:   () => void;
	private __resolveUpdate?: (bool: true) => void;

	readonly hasConnected:   boolean = false;
	readonly hasUpdated:     boolean = false;
	readonly updateComplete: Promise<boolean>;

	firstConnected(): void {
		(this.hasConnected as boolean) = true;
	}

	connected(): void {
		// We utilize a WeakRef to avoid a potential leak from
		// locking a direct reference to the instance in this scope.
		const ref = new WeakRef(this);

		// eslint-disable-next-line prefer-arrow-callback
		this.__unsubEffect = effect(function() {
			// We use a function to prevent this from the class from being captured.
			ref.deref()?.requestUpdate();
		});
	}

	afterConnected(): void {
	}

	disconnected(): void {
		this.__unsubEffect?.();
	}

	protected beforeUpdate(changedProps: Set<string | symbol>): void {
	}

	protected afterUpdate(changedProps: Set<string | symbol>): void {
	}

	requestUpdate(): Promise<boolean> {
		const metadata = this.constructor.metadata;

		for (const prop of metadata.signalProps ?? []) {
			const value = this[prop as keyof typeof this];

			if (metadata.previousProps.get(prop) !== value)
				metadata.changedProps.add(prop);

			metadata.previousProps.set(prop, value);
		}

		if (this.__resolveUpdate)
			return this.updateComplete;

		const { promise, resolve } = Promise.withResolvers<boolean>();
		(this as Writeable<this>).updateComplete = promise;
		this.__resolveUpdate = resolve;

		queueMicrotask(() => this.performUpdate());

		return this.updateComplete;
	}

	protected performUpdate(): void {
		if (!this.__resolveUpdate)
			return;

		const metadata = this.constructor.metadata;

		this.beforeUpdate(metadata.changedProps);

		render(this.render(), this.__element.deref()!.renderRoot, { host: this });

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

	protected query<T extends HTMLElement>(selector: string): T | undefined {
		const root = this.__element.deref()?.renderRoot;

		return root?.querySelector(selector) ?? undefined;
	}

	protected queryAll<T extends HTMLElement>(selector: string): T[] {
		const root = this.__element.deref()?.renderRoot;
		if (!root)
			return [];

		return [ ...root.querySelectorAll<T>(selector) ];
	}

	protected render(): unknown {
		return;
	};

	static styles: CSSStyle;

}


class TestAdapter extends AdapterElement {

	static override tagName = 'test-adapter';

	@property(String, { reflect: true }) accessor label = 'Hello World';
	@property(Number) accessor labelCount = 0;
	@state() protected accessor count = 0;

	override connected(): void {
		super.connected();
	}

	protected override render() {
		return html`<h1>${ this.label }</h1>`;
	}

	static override styles = css`
		:host {
			display: block;
			background-color: red;
		}
	`;

}
TestAdapter.register();
