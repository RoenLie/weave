import { invariant } from '@roenlie/core/validation';
import type { ReactiveElement } from 'lit';

import { component, getCurrentRef } from '../core/component.js';
import { Getter } from '../utilities/getter.js';


type UseQuery = <T extends Element = HTMLElement>(
	name: string,
	selector: string,
	cache?: boolean,
) => ({ value: T; });


export const useQuery = (<T extends Element = HTMLElement>(
	name: string,
	selector: string,
	cache?: boolean,
) => {
	const cls = getCurrentRef();
	invariant(cls, 'Could not get component instance.');

	if (!(name in cls.constructor.prototype)) {
		const descriptor = {
			get(this: ReactiveElement) {
				return this.renderRoot?.querySelector(selector) || undefined;
			},
			enumerable:   true,
			configurable: true,
		};

		if (cache) {
			const key = `__${ name }`;
			descriptor.get = function(this: ReactiveElement) {
				const me = this as unknown as Record<string, Element | null>;
				if (me[key] === undefined)
					me[key] = this.renderRoot?.querySelector(selector) ?? null;

				return me[key]!;
			};
		}

		Object.defineProperty(cls.constructor.prototype, name, descriptor);
	}

	return {
		get value(): T {
			return (cls as any)[name];
		},
	};
}) satisfies UseQuery;
