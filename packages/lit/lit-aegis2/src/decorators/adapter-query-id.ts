import { ReactiveElement } from 'lit';

import type { Adapter } from '../plugin/adapter.ts';
import type { QueryDecorator } from './adapter-query.ts';
import { desc, type Interface } from './utilities.ts';


export const queryId = (id: string, cache?: boolean) => {
	return (<C extends Interface<ReactiveElement> | Adapter, V extends HTMLElement | undefined>(
		protoOrTarget: ClassAccessorDecoratorTarget<C, V>,
		nameOrContext: PropertyKey | ClassAccessorDecoratorContext<C, V>,
		descriptor?: PropertyDescriptor,
	) => {
		const getElement = (el: ReactiveElement | Adapter): V => {
			const root = el instanceof ReactiveElement
				? el.renderRoot : el.shadowRoot;

			let element: HTMLElement | undefined;
			if (root instanceof HTMLElement)
				element = root.querySelector<HTMLElement>('#' + id) ?? undefined;
			else
				element = root.getElementById(id) ?? undefined;

			return element as V;
		};

		if (cache) {
			// Accessors to wrap from either:
			//   1. The decorator target, in the case of standard decorators
			//   2. The property descriptor, in the case of experimental decorators
			//      on auto-accessors.
			//   3. Functions that access our own cache-key property on the instance,
			//      in the case of experimental decorators on fields.
			const { get, set } = typeof nameOrContext === 'object' ? protoOrTarget : descriptor ?? (() => {
				const key = Symbol();
				type WithCache = Adapter & Record<symbol, Element | null>;

				return {
					get() { return (this as WithCache)[key]; },
					set(v) { (this as WithCache)[key] = v; },
				};
			})();

			return desc(protoOrTarget, nameOrContext, {
				get(this: Adapter): V {
					if (cache) {
						let result: V = get!.call(this);
						if (result === undefined) {
							result = getElement(this);
							set!.call(this, result);
						}

						return result;
					}

					return getElement(this);
				},
			});
		}
		else {
			// This object works as the return type for both standard and experimental decorators.
			return desc(protoOrTarget, nameOrContext, {
				get(this: ReactiveElement | Adapter) {
					return getElement(this);
				},
			});
		}
	}) as QueryDecorator;
};
