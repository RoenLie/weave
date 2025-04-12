import { type ResolvablePromise, resolvablePromise as promise } from '@roenlie/core/async';
import type { Writeable } from '@roenlie/core/types';
import { render } from 'lit-html';
import { Signal } from 'signal-polyfill';

import { effect } from '../shared/effect.ts';
import { DisposingEventHost } from './auto-disposing-event-host.ts';


// Ensure metadata is enabled. TypeScript does not polyfill
// Symbol.metadata, so we must ensure that it exists.
(Symbol as { metadata: symbol; }).metadata ??= Symbol('metadata');

type PropertyType = StringConstructor | ObjectConstructor | NumberConstructor | BooleanConstructor;
interface SignalElementMetadata {
	observedAttributes?: string[];
	propertyMetadata?:   Record<string, {
		propName: string;
		type:     PropertyType;
	}>;
	signalProps?: string[];
}


export class SignalElement extends DisposingEventHost {

	static tagName: string;
	static register(tagName?: string): void {
		queueMicrotask(() => this.registerNow(tagName));
	}

	static registerNow(tagName?: string): void {
		if (tagName)
			this.tagName = tagName;

		if (!customElements.get(this.tagName))
			customElements.define(this.tagName, this);
	}

	static get observedAttributes(): string[] {
		const metadata = this[Symbol.metadata] as SignalElementMetadata;

		return metadata?.observedAttributes ?? [];
	}

	protected static elementStyles: CSSStyleSheet[];
	protected static defineStyles(): void {
		if (this.elementStyles)
			return;

		const chain: any[] = [ this ];
		let proto = Object.getPrototypeOf(this);
		while (proto && proto !== HTMLElement) {
			chain.unshift(proto);
			proto = Object.getPrototypeOf(proto);
		}

		this.elementStyles = [];

		for (const proto of chain) {
			const styles = Array.isArray(proto.styles) ? proto.styles : [ proto.styles ];

			for (const style of styles) {
				if (Array.isArray(style)) {
					const flat = style.flat() as CSSStyleSheet[];
					this.elementStyles.push(...flat);
				}
				else if (style) {
					this.elementStyles.push(style);
				}
			}
		}
	}

	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		const base = (this.constructor as typeof SignalElement);
		base.defineStyles();
		this.shadowRoot!.adoptedStyleSheets = base.elementStyles;
	}

	readonly updateComplete: ResolvablePromise<boolean> = promise.resolve(true);
	readonly hasConnected:   boolean = false;
	readonly hasUpdated:     boolean = false;

	private get __metadata(): SignalElementMetadata | undefined {
		const metadata = this.constructor[Symbol.metadata] as SignalElementMetadata;

		return metadata;
	}

	private __unsubEffect?:  () => void;
	private __changedProps:  Set<string | symbol> = new Set();
	private __previousProps: Map<string | symbol, any> = new Map();

	attributeChangedCallback(name: string, _oldValue: string, newValue: string): void {
		const metadata = this.__metadata;
		const propMeta = metadata?.propertyMetadata?.[name];
		if (!propMeta)
			return console.warn(`Unknown attribute: ${ name }`);

		const type = propMeta.type;
		let convertedValue: any;

		if (type === Boolean)
			convertedValue = newValue === 'true' || newValue === '' || false;
		else if (type === String)
			convertedValue = newValue || '';
		else if (type === Number)
			convertedValue = Number(newValue);
		else if (type === Object)
			convertedValue = JSON.parse(newValue);

		const self = this as Record<PropertyKey, any>;
		convertedValue = convertedValue ?? undefined;

		if (self[propMeta.propName] !== convertedValue)
			self[propMeta.propName] = convertedValue;
	}

	protected override connected(): void {
		super.connected();

		const ref = new WeakRef(this);

		// eslint-disable-next-line prefer-arrow-callback
		this.__unsubEffect = effect(function() {
			// We utilize a WeakRef to avoid a potential leak from
			// locking a direct reference to the instance in this scope.
			const self = ref.deref();
			if (!self)
				return;

			self.requestUpdate();
		});

		if (!this.hasConnected) {
			(this.hasConnected as boolean) = true;
			this.firstConnected();
		}
	}

	protected override disconnected(): void {
		this.__unsubEffect?.();
		this.__unsubEffect = undefined;
		this.__changedProps.clear();
		this.__previousProps.clear();
	}

	/** Runs the immediatly after connectedCallback, the first time this component connects. */
	protected firstConnected(): void {}

	/** Runs after render has completed and dom has been painted after a connectedCallback. */
	protected afterConnected(): void {}

	/** Runs immediatly before render is performed. */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected beforeUpdate(changedProps: Set<string | symbol>): void {}

	/** Runs after render has completed and dom has painted. */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected afterUpdate(changedProps: Set<string | symbol>): void {}

	requestUpdate(): Promise<boolean> {
		for (const prop of this.__metadata?.signalProps ?? []) {
			const value = this[prop as keyof typeof this];

			if (this.__previousProps.get(prop) !== value)
				this.__changedProps.add(prop);

			this.__previousProps.set(prop, value);
		}

		if (!this.updateComplete.done)
			return this.updateComplete;

		(this as Writeable<this>).updateComplete = promise<boolean>();

		queueMicrotask(() => this.performUpdate());

		return this.updateComplete;
	}

	performUpdate(): void {
		if (this.updateComplete.done)
			return;

		this.beforeUpdate(this.__changedProps);

		render(this.render(), this.shadowRoot!, { host: this });

		// We need to wait for the next frame to ensure the DOM has been updated.
		setTimeout(() => {
			this.afterUpdate(this.__changedProps);
			this.__changedProps.clear();

			if (!this.hasUpdated) {
				(this.hasUpdated as boolean) = true;
				this.afterConnected();
			}

			this.updateComplete.resolve(true);
		});
	}

	/** Return a value which will be rendered into the componens shadowroot. */
	protected render(): unknown { return; }

	static styles: CSSStyle;

}


export type CSSStyle = CSSStyleSheet | CSSStyleSheet[] | CSSStyle[];
export const css = (strings: TemplateStringsArray, ...values: any[]): CSSStyle => {
	const stylesheet = new EnhancedCSSStyleSheet();
	stylesheet.replaceSync(strings.reduce((acc, str, i) => {
		const value = values[i]!;
		if (value instanceof EnhancedCSSStyleSheet)
			return acc + str + value.text;

		return acc + str + values[i];
	}, ''));

	return stylesheet;
};


export const state = () => <C extends SignalElement, V>(
	target: ClassAccessorDecoratorTarget<C, V>,
	context: ClassAccessorDecoratorContext<C, V>,
): ClassAccessorDecoratorResult<C, V> => {
	const { get } = target;

	const metadata = context.metadata as SignalElementMetadata;

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
) => <C extends SignalElement, V>(
	target: ClassAccessorDecoratorTarget<C, V>,
	context: ClassAccessorDecoratorContext<C, V>,
): ClassAccessorDecoratorResult<C, V> => {
	const { get } = target;

	const metadata = context.metadata as SignalElementMetadata;

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
		metadata.propertyMetadata[attrName] = { propName, type };
	}

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


export class EnhancedCSSStyleSheet extends CSSStyleSheet {

	text: string;

	override replaceSync(text: string): void {
		this.text = text;
		super.replaceSync(text);
	}

}
