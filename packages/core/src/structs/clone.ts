type Cloneable = Record<string, any> | any[];
type InstantiationFunction = (value: any) => any;


const isCloneable = (obj: any): obj is Cloneable => typeof obj === 'object' && obj !== null;


const _clone = <T>(
	seen: WeakMap<any, any>,
	input: T,
	instantiate?: InstantiationFunction,
): T => {
	if (!isCloneable(input))
		return input;

	if (seen.has(input))
		return seen.get(input);

	if (Array.isArray(input)) {
		const clonedArray: any[] = [];
		seen.set(input, clonedArray);
		for (const item of input)
			clonedArray.push(_clone(seen, item, instantiate));

		return clonedArray as T;
	}

	if (input instanceof Date)
		return new Date(input.getTime()) as T;

	if (input instanceof RegExp)
		return new RegExp(input.source, input.flags) as T;

	if (input instanceof Map) {
		const clonedMap = new Map();
		seen.set(input, clonedMap);
		for (const [ key, value ] of input.entries())
			clonedMap.set(_clone(seen, key, instantiate), _clone(seen, value, instantiate));

		return clonedMap as T;
	}

	if (input instanceof Set) {
		const clonedSet = new Set();
		seen.set(input, clonedSet);
		for (const value of input.values())
			clonedSet.add(_clone(seen, value, instantiate));

		return clonedSet as T;
	}

	if (input.constructor && input.constructor !== Object) {
		if (instantiate) {
			const newInstance = instantiate(input);
			seen.set(input, newInstance);

			return newInstance;
		}
		else {
			return input;
		}
	}

	const clonedObject: Cloneable = {};
	seen.set(input, clonedObject);
	for (const key in input) {
		if (input.hasOwnProperty(key))
			(clonedObject as any)[key] = _clone(seen, input[key], instantiate);
	}

	return clonedObject as T;
};


/**
 * Deep clones an object.\
 * Can be used to clone objects with circular references.\
 * Allows for custom instantiation of objects through a callback.
 */
export const clone = <T>(input: T, instantiate?: InstantiationFunction): T =>
	_clone(new WeakMap(), input, instantiate);
