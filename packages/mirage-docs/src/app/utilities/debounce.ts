/**
 * Returns the supplied function wrapped in a that runs only once, after a `delay`.
 *
 * Repeated calls to this function within the delay period will reset the timeout,
 * effectively delaying the call of the original function.
 */
export const debounce = <T extends (...args: any[]) => any>(
	func: T,
	delay = 0,
) => {
	let timeout: number;

	const fn = (...args: any[]) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), delay);
	};

	return fn as (...args: Parameters<T>) => void;
};
