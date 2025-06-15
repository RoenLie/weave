import { nothing } from 'lit-html';


type ChooseValue<T> = T extends undefined ? never : T;
type ChooseChild<T> = [
	condition: (value: ChooseValue<T>) => boolean,
	output: (value: ChooseValue<T>) => JSX.JSXElement,
];


/**
 * Conditionally renders content based on evaluating multiple condition-output pairs against a value.
 * Similar to lit-html's choose directive, evaluates each condition in order and renders the first match.
 *
 * @template T - The type of the value to evaluate against (defaults to undefined for no value)
 * @param props.value - The value to pass to each condition and output function
 * @param props.children - Single [condition, output] tuple or multiple tuple children to evaluate
 * @returns The rendered JSX element from the first matching condition, or nothing if no match
 *
 * @example
 * ```tsx
 * // Multiple condition-output tuples as separate children
 * <Choose value={status}>
 *   {[
 *     (status) => status === 'loading',
 *     () => <div>Loading...</div>
 *   ]}
 *   {[
 *     (status) => status === 'error',
 *     (status) => <div>Error: {status}</div>
 *   ]}
 *   {[
 *     () => true, // default case
 *     (status) => <div>Status: {status}</div>
 *   ]}
 * </Choose>
 * ```
 */
export function Choose<T = undefined>(props: {
	value?:   T;
	children: ChooseChild<T> | ChooseChild<T>[];
}): JSX.JSXElement {
	const children = Array.isArray(props.children.at(-1))
		? props.children as ChooseChild<T>[]
		: [ props.children as ChooseChild<T> ];

	for (const [ condition, output ] of children) {
		if (condition(props.value as ChooseValue<T>))
			return output(props.value as ChooseValue<T>);
	}

	return nothing;
}
