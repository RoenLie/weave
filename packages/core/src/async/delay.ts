/**
 * Await a single render cycle.
 */
export const paintCycle = (): Promise<unknown> =>
	new Promise(resolve => requestAnimationFrame(resolve));


/**
 * Await a timeout.
 *
 * @param delay The delay in milliseconds.
 */
export const sleep = (delay: number): Promise<unknown> =>
	new Promise(resolve => setTimeout(resolve, delay));
