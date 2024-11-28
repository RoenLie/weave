import { ReactiveElement } from 'lit';
import { queryAsync as litQueryAsync } from 'lit/decorators.js';

import type { Adapter } from '../adapter.js';
import { defineProperty, type IReactiveElement } from './utilities.js';


export interface QueryAsyncDecorator {
	(
		proto: IReactiveElement | Adapter,
		name: PropertyKey,
		descriptor?: PropertyDescriptor
	): void | any;
	<C extends IReactiveElement | Adapter, V extends Promise<Element | undefined>>(
		value: ClassAccessorDecoratorTarget<C, V>,
		context: ClassAccessorDecoratorContext<C, V>
	): ClassAccessorDecoratorResult<C, V>;
}


export const queryAsync = (selector: string) => {
	return ((proto: IReactiveElement | Adapter, name: string): void | any => {
		if (proto instanceof ReactiveElement)
			return litQueryAsync(selector)(proto, name);

		return defineProperty(proto, name, {
			async get(this: Adapter) {
				await this.element.updateComplete;

				return this.querySelector(selector) ?? undefined;
			},
		});
	}) as QueryAsyncDecorator;
};
