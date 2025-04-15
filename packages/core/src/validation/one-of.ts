export const oneOf = <T extends string | number>(
	union: T, ...values: T[]
): boolean => values.includes(union);
