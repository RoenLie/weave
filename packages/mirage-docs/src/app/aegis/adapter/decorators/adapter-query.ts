import { ReactiveElement } from 'lit';
import { query as litQuery } from 'lit/decorators.js';

import type { Adapter } from '../adapter.js';
import { defineProperty, type IReactiveElement } from './utilities.js';


export interface QueryDecorator {
	(
		proto: IReactiveElement | Adapter,
		name: PropertyKey,
		descriptor?: PropertyDescriptor
	): void | any;
	<C extends IReactiveElement | Adapter, V extends Element>(
		value: ClassAccessorDecoratorTarget<C, V>,
		context: ClassAccessorDecoratorContext<C, V>
	): ClassAccessorDecoratorResult<C, V>;
}


export const query = (selector: string, cache?: boolean) => {
	return (<C extends IReactiveElement | Adapter, V extends Element | undefined>(
		protoOrTarget: ClassAccessorDecoratorTarget<C, V>,
		nameOrContext: PropertyKey | ClassAccessorDecoratorContext<C, V>,
		descriptor?: PropertyDescriptor,
	) => {
		if (protoOrTarget instanceof ReactiveElement) {
			return litQuery(selector, cache)(
				protoOrTarget,
				nameOrContext as PropertyKey,
				descriptor,
			);
		}

		const doQuery = (el: Adapter): V => (el.querySelector(selector) ?? undefined) as V;

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
					get() {
						return (this as WithCache)[key];
					},
					set(v) {
						(this as WithCache)[key] = v;
					},
				};
			})();

			return defineProperty(protoOrTarget, nameOrContext, {
				get(this: Adapter): V {
					if (cache) {
						let result: V = get!.call(this);
						if (result === undefined) {
							result = doQuery(this);
							set!.call(this, result);
						}

						return result;
					}

					return doQuery(this);
				},
			});
		}
		else {
			// This object works as the return type for both standard and experimental decorators.
			return defineProperty(protoOrTarget, nameOrContext, {
				get(this: Adapter) {
					return doQuery(this);
				},
			});
		}
	}) as QueryDecorator;
};
