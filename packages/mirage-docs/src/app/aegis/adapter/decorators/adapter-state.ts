import { ReactiveElement } from 'lit';
import { state as litState, type StateDeclaration } from 'lit/decorators.js';

import type { Adapter } from '../adapter.js';
import type { IReactiveElement } from './utilities.js';


export const state = (options?: StateDeclaration<unknown> | undefined) => {
	return (proto: IReactiveElement | Adapter, name: string): void | any => {
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
