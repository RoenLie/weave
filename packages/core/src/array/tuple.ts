/** Coerces a rest argument into a tuple type. */
export const tuple = <T extends unknown[]>(...args: T): T => args;
