import { join } from 'lit-html/directives/join.js';
import { map } from 'lit-html/directives/map.js';
import { repeat } from 'lit-html/directives/repeat.js';


/**
 * Renders a list of items with optional keys and separators.
 *
 * @template T - The type of items in the array
 * @template U - The JSX element type returned by the render function
 * @param props.each - Array of items to render
 * @param props.key - Optional key function for efficient updates (uses lit-html's repeat directive)
 * @param props.separator - Optional JSX element to insert between items
 * @param props.children - Render function that receives each item and its index
 * @returns An iterator from either the map or repeat directive, depending on whether a key function is provided.
 *
 * @example
 * ```tsx
 * <For each={users} key={(user) => user.id}>
 *   {(user, index) => <div key={user.id}>{user.name}</div>}
 * </For>
 * ```
 */
export function For<T, U extends JSX.JSXElement>(props: {
	each:       readonly T[];
	key?:       (item: T, index: number) => any;
	separator?: JSX.JSXElement;
	children:   (item: T, index: number) => U;
}): JSX.JSXElement {
	if (props.key) {
		return repeat(
			props.each,
			(item, index) => props.key!(item, index),
			(item, index) => {
				if (props.separator && index > 0)
					return [ props.separator, props.children(item, index) ];

				return props.children(item, index);
			},
		);
	}

	if (props.separator) {
		return join(map(
			props.each,
			(item, index) => props.children(item, index),
		), props.separator);
	}

	return map(
		props.each,
		(item, index) => props.children(item, index),
	);
}
