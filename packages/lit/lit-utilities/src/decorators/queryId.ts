import type { RecordOf } from '@roenlie/mimic-core/types';
import type { ReactiveElement } from 'lit';

import { decorateProperty } from './decorator-utility.js';


export const queryId = (id: string, cache?: boolean) => {
	return decorateProperty({
		descriptor: (name: PropertyKey) => {
			const descriptor = {
				get(this: ReactiveElement) {
					return this.shadowRoot?.getElementById(id) ?? undefined;
				},
				enumerable:   true,
				configurable: true,
			};

			if (cache) {
				const key = typeof name === 'symbol' ? Symbol() : `__${ name }`;
				descriptor.get = function(this: ReactiveElement) {
					const me = this as RecordOf<typeof this>;
					if (me[key] === undefined)
						me[key] = this.shadowRoot?.getElementById(id) ?? undefined;

					return me[key];
				};
			}

			return descriptor;
		},
	});
};
