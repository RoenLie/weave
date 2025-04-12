import { Signal } from 'signal-polyfill';

import type { AdapterElement, AdapterProxy } from './adapter-element.ts';
import type { AdapterMetadata, PropertyType } from './types.ts';

// Ensure metadata is enabled. TypeScript does not polyfill
// Symbol.metadata, so we must ensure that it exists.
(Symbol as { metadata: symbol; }).metadata ??= Symbol('metadata');


export const customElement = (tagName: string) => <C extends typeof AdapterElement>(base: C): void => {
	base.tagName = tagName;
	base.register();
};


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
