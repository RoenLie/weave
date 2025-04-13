/**
 * Alias for a generic function.
 */
export type Fn<A = any, R = any> = (...args: A[]) => R;


/**
 * Alias for a generic async function.
 */
export type AsyncFn<A = any, R = void> = (...args: A[]) => Promise<R>;
