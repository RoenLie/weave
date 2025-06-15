import { when as litWhen } from 'lit-html/directives/when.js';


type Falsy = null | undefined | false | 0 | -0 | 0n | '';
export const when = litWhen as <C, T, F>(
	condition: C,
	trueCase: (c: NoInfer<Exclude<C, Falsy>>) => T,
	falseCase?: (c: NoInfer<Exclude<C, Falsy>>) => F,
) => C extends Falsy ? F : T;

type ShowTrueCase<C, T> = (value: NoInfer<Exclude<C, Falsy>>) => T;
type ShowFalseCase<C, F> = (value: NoInfer<Exclude<C, Falsy>>) => F;
type ShowChildren<C, T, F> =
	| ShowTrueCase<C, T>
	| [ true: ShowTrueCase<C, T>, false: ShowFalseCase<C, F> ];


/**
 * Conditionally renders content based on a truthy value.
 *
 * @template T - The type of the condition value
 * @template U - The JSX element type returned by the render functions
 * @param props.when - The condition value to evaluate for truthiness
 * @param props.children - A single render or tuple containing render functions for true and optionally false cases
 * @returns The rendered JSX element based on the condition's truthiness
 *
 * @example
 * ```tsx
 * <Show when={user}>
 *   {(user) => <div>Welcome, {user.name}!</div>}
 *   {() => <div>Please log in</div>}
 * </Show>
 *
 * // Or without fallback
 * <Show when={isVisible}>
 *   {() => <div>This content is visible</div>}
 * </Show>
 * ```
 */
export function Show<C, T, F>(props: {
	when:     C;
	children: ShowChildren<C, T, F>;
}): C extends Falsy ? F : T {
	if (Array.isArray(props.children))
		return when(props.when, props.children[0], props.children[1]);

	return when(props.when, props.children);
}
