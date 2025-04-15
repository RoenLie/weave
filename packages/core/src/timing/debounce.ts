import type { AsyncFn, Fn } from '../types/function.types.js';
import type { Timeout } from '../types/utility-types.js';


/**
 * Returns the supplied function wrapped in a that runs only once, after a `delay`.
 *
 * Repeated calls to this function within the delay period will reset the timeout,
 * effectively delaying the call of the original function.
 */
export const debounce = <T extends () => any>(
	func: T,
	delay = 0,
): {
	(): void;
	run(): void;
	cancel(): void;
} => {
	let timeout: Timeout = 0;

	const innerFunc = () => { func(); };
	const fn = () => {
		clearTimeout(timeout);
		timeout = setTimeout(innerFunc, delay);
	};

	fn.run = () => {
		if (timeout) {
			clearTimeout(timeout);
			timeout = 0;
			innerFunc();
		}
	};

	fn.cancel = () => {
		clearTimeout(timeout);
		timeout = 0;
	};

	return fn;
};


/**
 * Debounce implementation that returns a curry function used for assigning a callback
 * to each individual usage scenario.
 *
 * Using the curry functionality is not mandatory.
 * @example
 * ```ts
 * 	const debouncedFilter = debounce((value: string) => navMenuService.filterMenu(value), 500);
 *
 * 	debouncedFilter(value)(res => navMenu = res);
 * ```
 * .
 */
export const curryDebounce = <T extends Fn<any, ReturnType<T>> | AsyncFn<any, ReturnType<T>>>(
	func: T,
	delay = 0,
): (...args: Parameters<T>) => (callback: (result: Awaited<ReturnType<T>>) => void) => void => {
	const callbacks: Map<string, (...args: any) => any> = new Map();
	let timer: number;

	const debounceFunc = (...args: any[]) => {
		clearTimeout(timer);

		timer = setTimeout(async () => {
			const result = await func(...args);

			callbacks.forEach(c => c(result));
			callbacks.clear();
		}, delay, ...args);

		return (callback: Fn) => {
			callbacks.set(callback.toString(), callback);
		};
	};

	return debounceFunc;
};


/**
 * Triggers the initial function immediatly on every successive call.
 * Activates a debounce that fulfills and triggers the debounce function
 * only if there has been a sufficient delay between activations.
 */
export const withDebounce = <
	TFunc extends (...args: any[]) => any,
	TDebounce extends () => any,
>(
	func: TFunc,
	debounceFunc: TDebounce,
	delay: number,
): {
	(...args: Parameters<TFunc>): any;
	run:    () => void;
	cancel: () => void;
} => {
	const deb = debounce(debounceFunc, delay);
	const fn = (...args: Parameters<TFunc>) => { return deb(), func(...args); };
	fn.run = deb.run;
	fn.cancel = deb.cancel;

	return fn;
};
