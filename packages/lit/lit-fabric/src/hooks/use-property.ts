import { invariant } from '@roenlie/core/validation';
import type { LitElement, PropertyDeclaration } from 'lit';

import { component, getCurrentRef } from '../core/component.js';


class HookGetter {

}


type UseProperty<T = any> = (
	name: string,
	initialValue: T,
	options?: PropertyDeclaration<T>
) => readonly [ { value: T; }, (value: T) => void ];

export const useProperty2 = <T>(
	name: string,
	initialValue: T,
	options: PropertyDeclaration<T> = {},
) => {
	const ctor = component.ctorRef as unknown as typeof LitElement;
	invariant(ctor, 'Could not get constructor');

	ctor.properties ??= {};
	Object.assign(ctor.properties, {
		[name]: options,
	});

	const sideEffects = component.sideEffects.get(ctor) ?? (() => {
		return component.sideEffects.set(ctor, []).get(ctor)!;
	})();
};


export const useProperty = (<T>(
	name: string,
	initialValue: T,
	options: PropertyDeclaration<T> = {},
) => {
	type Cls = ReturnType<typeof getCurrentRef> & Record<keyof any, any>;
	const cls = getCurrentRef() as Cls;
	invariant(cls, 'Could not get component instance.');

	const ctor = cls.constructor;
	if (!(name in ctor.prototype)) {
		ctor.createProperty(name, options);

		//@ts-ignore
		const attr = ctor.__attributeNameForProperty(name, options);
		if (attr !== undefined) {
			//@ts-ignore
			ctor.__attributeToPropertyMap.set(attr, options);
			const attrVal = cls.getAttribute(attr);
			if (attrVal)
				initialValue = attrVal as T;
		}
	}

	cls[name] = initialValue;

	const setter = (value: T) => cls[name] = value;
	const getter = {
		get value() {
			return cls[name];
		},
	};

	type Property<T> = readonly [
		{ readonly value: T; }, (value: T) => void
	];

	return [
		getter,
		setter,
	] as Property<T>;
}) satisfies UseProperty;


export const useState = (<T>(
	name: string,
	initialValue: T,
	options?: PropertyDeclaration<T>,
) => useProperty(
	name,
	initialValue,
	{ ...options, state: true },
)) satisfies UseProperty;
