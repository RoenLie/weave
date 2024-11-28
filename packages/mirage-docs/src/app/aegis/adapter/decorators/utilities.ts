import type { ReactiveElement } from 'lit';


/**
 * @internalexport
 */
export type IReactiveElement = Interface<ReactiveElement>;


/**
 * Generates a public interface type that removes private and protected fields.
 * @internalexport
 */
export type Interface<T> = {
	[K in keyof T]: T[K];
};


/**
 * Marks the defined property as configurable, and enumerable, and handles
 * the case where we have a busted Reflect.decorate zombiefill (e.g. in Angular
 * apps).
 *
 * @internalexport
 */
export const defineProperty = (
	obj: object,
	name: PropertyKey | ClassAccessorDecoratorContext<unknown, unknown>,
	descriptor: PropertyDescriptor,
) => {
	// For backwards compatibility, we keep them configurable and enumerable.
	descriptor.configurable = true;
	descriptor.enumerable = true;

	type ReflectExt = typeof Reflect & {decorate?: unknown};
	if ((Reflect as ReflectExt).decorate && typeof name !== 'object') {
		// If we're called as a legacy decorator, and Reflect.decorate is present
		// then we have no guarantees that the returned descriptor will be
		// defined on the class, so we must apply it directly ourselves.

		Object.defineProperty(obj, name, descriptor);
	}

	return descriptor;
};
