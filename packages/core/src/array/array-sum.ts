/**
 * Returns the sum of all numbers in an array of numbers.
 */
export const arraySum = (arr: (number | null | undefined)[]): number =>
	arr.reduce((acc: number, cur) => acc += Number(cur), 0);


/**
 * Returns the sum of all numbers in an array of objects using a prop function.
 */
export const arrayObjSum = <T extends Record<keyof any, any>>(
	arr: T[], prop: (obj: T) => any,
): number => arr.reduce((acc: number, cur) => acc += Number(prop(cur)), 0);
