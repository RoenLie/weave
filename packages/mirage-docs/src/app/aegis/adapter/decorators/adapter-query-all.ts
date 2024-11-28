import { ReactiveElement } from 'lit';

import type { Adapter } from '../adapter.js';
import { defineProperty, type IReactiveElement } from './utilities.js';


export interface QueryAllDecorator {
	(
		proto: IReactiveElement | Adapter,
		name: PropertyKey,
		descriptor?: PropertyDescriptor
	): void | any;
	<C extends IReactiveElement | Adapter, V extends NodeList>(
		value: ClassAccessorDecoratorTarget<C, V>,
		context: ClassAccessorDecoratorContext<C, V>
	): ClassAccessorDecoratorResult<C, V>;
}


// Shared fragment used to generate empty NodeLists when a render root is undefined
let fragment: DocumentFragment;


export const queryAll = (selector: string): QueryAllDecorator => {
	return ((
		obj: IReactiveElement | Adapter,
		name: PropertyKey,
	) => {
		return defineProperty(obj, name, {
			get(this: ReactiveElement | Adapter) {
				const container = (
					this instanceof ReactiveElement ? this.renderRoot : this.shadowRoot
				) ?? (fragment ??= document.createDocumentFragment());

				return container.querySelectorAll(selector);
			},
		});
	}) as QueryAllDecorator;
};
