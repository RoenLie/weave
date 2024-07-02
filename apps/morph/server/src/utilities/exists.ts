export const exists = <T>(value: T): value is T & Record<never, never> =>
	value !== undefined;
