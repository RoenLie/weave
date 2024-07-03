/**
 * Await a timeout.
 *
 * @param delay The delay in milliseconds.
 */
export const sleep = (delay: number) => new Promise(resolve => setTimeout(resolve, delay));
