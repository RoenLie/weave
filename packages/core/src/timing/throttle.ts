import type { Fn } from '../types/function.types.js';
import type { Timeout } from '../types/utility-types.js';


/**
 * Takes in a `func`, returns a new function that performs the same task as the original,
 * but is capped to only execute at the given `rate` in milliseconds.
 */
export const throttle = <T extends Fn<Args, void>, Args = any>(func: T, rate: number): T => {
	let lastFunc: Timeout;
	let lastRan: number;

	const callback = (...args: Parameters<T>): void => {
		if (!lastRan) {
			func(...args);
			lastRan = Date.now();
		}
		else {
			clearTimeout(lastFunc);

			lastFunc = setTimeout(() => {
				if (Date.now() - lastRan >= rate) {
					func(...args);
					lastRan = Date.now();
				}
			}, rate - (Date.now() - lastRan));
		}
	};

	return callback as T;
};
