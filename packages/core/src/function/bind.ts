import type { Fn } from '../types/function.types.ts';


/**
 * A WeakMap registry for caching bound functions.
 * The outer WeakMap uses the caller object as the key,
 * and the inner WeakMap uses the function as the key.
 */
const bindRegistry: WeakMap<object, WeakMap<Fn, Fn>> = new WeakMap();


/**
 * Binds a function to a specific caller object, caching the bound function for reuse.
 *
 * Multiple calls with the same function and caller will return the same bound function.
 * @param fn The function to bind.
 * @param caller The object to bind the function to.
 * @returns The bound function.
 */
export const bind = <Func extends Fn>(fn: Func, caller: object): Func => {
	const registry = bindRegistry.get(caller) ?? bindRegistry
		.set(caller, new WeakMap()).get(caller)!;

	if (registry.has(fn))
		return registry.get(fn)! as Func;

	const bound = fn.bind(caller);
	registry.set(fn, bound);

	return bound as Func;
};


/**
 * Unbinds a function from a specific caller object, removing the cached bound function.
 * @param fn The function to unbind.
 * @param caller The object to unbind the function from.
 * @returns The unbound function or undefined if it was not found.
 */
export const unbind = <Func extends Fn>(fn: Func, caller: object): Func | void => {
	const registry = bindRegistry.get(caller);
	if (!registry)
		return;

	const bound = registry.get(fn);
	if (bound) {
		registry.delete(fn);

		return bound as Func;
	}

	return;
};
