import { ReactiveElement } from 'lit';
import type { StateDeclaration } from 'lit/decorators.js';
import { state as litState } from 'lit/decorators.js';

import type { Adapter } from '../plugin/adapter.ts';
import type { Interface } from './utilities.ts';


export const state = (options?: StateDeclaration<unknown> | undefined) => {
	return (proto: Interface<ReactiveElement> | Adapter, name: string): void | any => {
		if (proto instanceof ReactiveElement)
			return litState(options)(proto, name);

		let value: undefined;

		Object.defineProperty(proto, name, {
			get(this: Adapter) {
				return value;
			},
			set(this: Adapter, v) {
				const oldValue = value;
				value = v;

				this.requestUpdate(name, oldValue, { state: true });
			},
		});
	};
};
