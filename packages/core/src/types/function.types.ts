/**
 * Alias for a generic function.
 */
export type Fn<T = any, O = any> = (...args: T[]) => O;

/**
 * Alias for a generic async function.
 */
export type AsyncFn<T = any, O = void> = (...args: T[]) => Promise<O>;
