const getTypeAsString = (obj: any) => {
	return Object.prototype
		.toString.call(obj)
		.replace(/^\[object (.+)\]$/, '$1')
		.toLowerCase();
};


/**
 * Wrapper for toString.call(var) to more easily and reliably get the correct type from a variable.
 * Also asserts the type for better typings.
 */
export const typeOf = {
	string: (value: any): value is string => {
		return getTypeAsString(value) === 'string';
	},
	number: (value: any): value is number => {
		return getTypeAsString(value) === 'number';
	},
	array: (value: any): value is any[] => {
		return getTypeAsString(value) === 'array';
	},
	object: (value: any): value is object => {
		return getTypeAsString(value) === 'object';
	},
	objectLike: (value: any): value is object => {
		return typeof value === 'object';
	},
	record: (value: any): value is Record<keyof any, any> => {
		return getTypeAsString(value) === 'object';
	},
	function: (value: any): value is (...args: any) => any => {
		return getTypeAsString(value) === 'function';
	},
	symbol: (value: any): value is symbol => {
		return getTypeAsString(value) === 'symbol';
	},
	custom: <T>(value: any, condition: (value: T) => boolean): value is T => {
		return condition(value);
	},
};
