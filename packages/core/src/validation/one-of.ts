export const oneOf = <T extends string | number>(union: T, ...values: T[]) => values.includes(union);
