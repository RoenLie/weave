import { ReactiveElement } from 'lit';

import type { Adapter } from '../plugin/adapter.ts';
import { desc, type Interface } from './utilities.ts';


export interface QueryAllDecorator {
	(
		proto: Interface<ReactiveElement> | Adapter,
		name: PropertyKey,
		descriptor?: PropertyDescriptor
	): void | any;
	<C extends Interface<ReactiveElement> | Adapter, V extends NodeList>(
		value: ClassAccessorDecoratorTarget<C, V>,
		context: ClassAccessorDecoratorContext<C, V>
	): ClassAccessorDecoratorResult<C, V>;
}


// Shared fragment used to generate empty NodeLists when a render root is undefined
let fragment: DocumentFragment;


export const queryAll = (selector: string): QueryAllDecorator => {
	return ((
		obj: Interface<ReactiveElement> | Adapter,
		name: PropertyKey,
	) => {
		return desc(obj, name, {
			get(this: ReactiveElement | Adapter) {
				const container = (
					this instanceof ReactiveElement ? this.renderRoot : this.shadowRoot
				) ?? (fragment ??= document.createDocumentFragment());

				return container.querySelectorAll(selector);
			},
		});
	}) as QueryAllDecorator;
};
