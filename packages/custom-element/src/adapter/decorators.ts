/* eslint-disable @typescript-eslint/unified-signatures */
import type { Interface, Writeable } from '@roenlie/core/types';
import { PluginContainer } from '@roenlie/injector';
import { Signal } from 'signal-polyfill';

import type { AdapterBase, AdapterElement } from './adapter-element.ts';
import type { AdapterMetadata, PropertyType } from './types.ts';


export interface ClassDecorator {
	// legacy decorator signature
	<Class extends abstract new (...args: any) => any>(
		target: Class,
	): Class | void;
	// decorator signature
	<Class extends abstract new (...args: any) => any>(
		target: Class,
		context: ClassDecoratorContext<NoInfer<Class>>,
	): Class | void;
}


export interface PropertyDecorator {
	// accessor decorator signature
	<C extends Interface<AdapterElement>, V>(
		target: ClassAccessorDecoratorTarget<C, V>,
		context: ClassAccessorDecoratorContext<C, V>
	): ClassAccessorDecoratorResult<C, V>;
	// setter decorator signature
	<C extends Interface<AdapterElement>, V>(
		target: (value: V) => void,
		context: ClassSetterDecoratorContext<C, V>
	): (this: C, value: V) => void;
	// legacy decorator signature
	(
		protoOrDescriptor: AdapterElement,
		name: PropertyKey,
		descriptor?: PropertyDescriptor
	): any;
}


// Ensure metadata is enabled. TypeScript does not polyfill
// Symbol.metadata, so we must ensure that it exists.
(Symbol as { metadata: symbol; }).metadata ??= Symbol('metadata');


export const customElement = (
	tagName: string,
): ClassDecorator => <C extends { tagName: string; register: (...args: any[]) => void; }>(
	base: C,
): void => {
	const writeable = (base as Writeable<C>);
	if (writeable.tagName)
		return;

	writeable.tagName = tagName;
	queueMicrotask(() => base.register());
};


const createStateMetadata = (
	metadata: AdapterMetadata,
	propName: string,
) => {
	metadata.signalProps ??= [];
	if (!metadata.signalProps.includes(propName))
		metadata.signalProps.push(propName);
};

const legacyState = (
) => (
	target: object,
	property: string,
): any => {
	const hasOwnProperty = target.hasOwnProperty(property);
	const metadata = ((target.constructor as any)[Symbol.metadata] ??= {}) as AdapterMetadata;
	const propName = property;

	createStateMetadata(metadata, propName);

	const descriptor: PropertyDescriptor = {
		get() {
			const me = this as any;
			const signal = me['__' + propName] ??= new Signal.State(me['__' + propName]);

			return signal.get();
		},
		set(v: any) {
			const me = this as any;
			const signal = me['__' + propName] ??= new Signal.State(me['__' + propName]);
			signal.set(v);
		},
	};

	Object.defineProperty(target, property, descriptor);

	return hasOwnProperty
		? Object.getOwnPropertyDescriptor(target, propName)
		: undefined;
};

const standardState = (
) => <C extends Interface<AdapterElement>, V>(
	target: ClassAccessorDecoratorTarget<C, V>,
	context: ClassAccessorDecoratorContext<C, V>,
): ClassAccessorDecoratorResult<C, V> => {
	const { get } = target;

	const metadata = context.metadata as any as AdapterMetadata;
	const propName = context.name.toString();
	createStateMetadata(metadata, propName);

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

export const state = (
): PropertyDecorator => <C extends Interface<AdapterElement>, V>(
	protoOrTarget:
	| object
	| ClassAccessorDecoratorTarget<C, V>
	| ((value: V) => void),
	nameOrContext:
	| PropertyKey
	| ClassAccessorDecoratorContext<C, V>
	| ClassSetterDecoratorContext<C, V>,
): any => {
	if (typeof nameOrContext === 'string')
		return legacyState()(protoOrTarget, nameOrContext);

	return standardState()(
		protoOrTarget as ClassAccessorDecoratorTarget<C, V>,
		nameOrContext as ClassAccessorDecoratorContext<C, V>,
	);
};


const createPropertyMetadata = (
	type: PropertyType = String,
	options: { reflect?: boolean; },
	metadata: AdapterMetadata,
	propName: string,
): string => {
	metadata.signalProps ??= [];
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

	return attrName;
};

const legacyProperty = (
	type: PropertyType = String,
	options: { reflect?: boolean; } = {},
) => (
	target: object,
	property: string,
): any => {
	const hasOwnProperty = target.hasOwnProperty(property);
	const metadata = ((target.constructor as any)[Symbol.metadata] ??= {}) as AdapterMetadata;
	const propName = property;
	const attrName = createPropertyMetadata(type, options, metadata, propName);

	const descriptor: PropertyDescriptor = {
		get() {
			const me = this as any;
			const signal = me['__' + propName] ??= new Signal.State(me['__' + propName]);

			return signal.get();
		},
		set(v: any) {
			const me = this as any;
			const signal = me['__' + propName] ??= new Signal.State(me['__' + propName]);
			signal.set(v);

			if (metadata.propertyMetadata[attrName]?.reflect) {
				(this as any as { __element?: WeakRef<AdapterBase>; })
					.__element?.deref()
					?.setAttribute(propName, String(v));
			}
		},
	};

	Object.defineProperty(target, property, descriptor);

	return hasOwnProperty
		? Object.getOwnPropertyDescriptor(target, propName)
		: undefined;
};

const standardProperty = (
	type: PropertyType = String,
	options: { reflect?: boolean; } = {},
) => <C extends Interface<AdapterElement>, V>(
	target: ClassAccessorDecoratorTarget<C, V>,
	context: ClassAccessorDecoratorContext<C, V>,
): ClassAccessorDecoratorResult<C, V> => {
	const { get } = target;

	const metadata = context.metadata as any as AdapterMetadata;
	const propName = context.name.toString();
	const attrName = createPropertyMetadata(type, options, metadata, propName);

	return {
		get() {
			const signal = (get.call(this) as Signal.State<V>);

			return signal.get();
		},
		set(value: V) {
			const signal = (get.call(this) as Signal.State<V>);
			signal.set(value);

			if (metadata.propertyMetadata[attrName]?.reflect) {
				(this as any as { __element: WeakRef<AdapterBase>; })
					.__element.deref()
					?.setAttribute(propName, String(value));
			}
		},
		init(value: any): any {
			return new Signal.State(value);
		},
	};
};

export const property = (
	type: PropertyType = String,
	options?: { reflect?: boolean; },
): PropertyDecorator => <C extends Interface<AdapterElement>, V>(
	protoOrTarget:
	| object
	| ClassAccessorDecoratorTarget<C, V>
	| ((value: V) => void),
	nameOrContext:
	| PropertyKey
	| ClassAccessorDecoratorContext<C, V>
	| ClassSetterDecoratorContext<C, V>,
): any => {
	if (typeof nameOrContext === 'string')
		return legacyProperty(type, options)(protoOrTarget, nameOrContext);

	return standardProperty(type, options)(
		protoOrTarget as ClassAccessorDecoratorTarget<C, V>,
		nameOrContext as ClassAccessorDecoratorContext<C, V>,
	);
};


const legacyQuery = (
	selector: string,
	cache: boolean = false,
) => (
	target: object,
	property: string,
) => {
	const hasOwnProperty = target.hasOwnProperty(property);
	const propName = property;

	const descriptor: PropertyDescriptor = {
		get() {
			const me = (this as Interface<AdapterElement> & Record<string, unknown>);
			if (cache) {
				const cached = me['__cached' + propName];
				if (cached !== undefined)
					return cached;
			}

			const el = me.query(selector);
			if (cache)
				me['__cached' + propName] = el;

			return el;
		},
		set(v: any) {},
	};

	Object.defineProperty(target, property, descriptor);

	return hasOwnProperty
		? Object.getOwnPropertyDescriptor(target, propName)
		: undefined;
};

const standardQuery = (
	selector: string,
	cache: boolean = false,
) => <C extends Interface<AdapterElement>, V>(
	target: ClassAccessorDecoratorTarget<C, V>,
	context: ClassAccessorDecoratorContext<C, V>,
): ClassAccessorDecoratorResult<C, V> => {
	const { get, set } = target;

	return {
		get() {
			if (cache) {
				const cached = get.call(this);
				if (cached !== undefined)
					return cached as unknown as V;
			}

			const el = this.query(selector) as unknown as V;
			if (cache)
				set.call(this, el);

			return el;
		},
		set(value: V) {},
		init(value: any): any {},
	};
};


export const query = (
	selector: string,
): PropertyDecorator => <C extends Interface<AdapterElement>, V>(
	protoOrTarget:
	| object
	| ClassAccessorDecoratorTarget<C, V>
	| ((value: V) => void),
	nameOrContext:
	| PropertyKey
	| ClassAccessorDecoratorContext<C, V>
	| ClassSetterDecoratorContext<C, V>,
): any => {
	if (typeof nameOrContext === 'string')
		return legacyQuery(selector)(protoOrTarget, nameOrContext);

	return standardQuery(selector)(
		protoOrTarget as ClassAccessorDecoratorTarget<C, V>,
		nameOrContext as ClassAccessorDecoratorContext<C, V>,
	);
};


export const provider = (
): ClassDecorator => <C extends typeof AdapterElement>(
	base: C,
	context?: ClassDecoratorContext<NoInfer<C>>,
): any => {
	const metadata = context
		? (context.metadata as any) as AdapterMetadata
		: ((base.constructor as any)[Symbol.metadata] ??= {}) as AdapterMetadata;

	metadata.pluginContainer = new PluginContainer();

	return base;
};
