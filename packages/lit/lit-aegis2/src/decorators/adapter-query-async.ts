import { ReactiveElement } from 'lit';
import { queryAsync as litQueryAsync } from 'lit/decorators.js';

import type { Adapter } from '../plugin/adapter.ts';
import { desc, type Interface } from './utilities.ts';


export interface QueryAsyncDecorator {
	(
		proto: Interface<ReactiveElement> | Adapter,
		name: PropertyKey,
		descriptor?: PropertyDescriptor
	): void | any;
	<C extends Interface<ReactiveElement> | Adapter, V extends Promise<Element | undefined>>(
		value: ClassAccessorDecoratorTarget<C, V>,
		context: ClassAccessorDecoratorContext<C, V>
	): ClassAccessorDecoratorResult<C, V>;
}


export const queryAsync = (selector: string) => {
	return ((proto: Interface<ReactiveElement> | Adapter, name: string): void | any => {
		if (proto instanceof ReactiveElement)
			return litQueryAsync(selector)(proto, name);

		return desc(proto, name, {
			async get(this: Adapter) {
				await this.element.updateComplete;

				return this.querySelector(selector) ?? undefined;
			},
		});
	}) as QueryAsyncDecorator;
};
