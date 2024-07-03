type Cloneable = Record<string, any> | any[];


const isCloneable = (obj: any): obj is Cloneable => typeof obj === 'object' && obj !== null;


type InstantiationFunction = (value: any) => any;


export const clone = <T>(
	input: T,
	instantiate?: InstantiationFunction,
): T => {
	const seen = new WeakMap<any, any>();

	const _clone = <T>(input: T): T => {
		if (!isCloneable(input))
			return input;

		if (seen.has(input))
			return seen.get(input);

		if (Array.isArray(input)) {
			const clonedArray: any[] = [];
			seen.set(input, clonedArray);
			for (const item of input)
				clonedArray.push(_clone(item));

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
				clonedMap.set(_clone(key), _clone(value));

			return clonedMap as T;
		}

		if (input instanceof Set) {
			const clonedSet = new Set();
			seen.set(input, clonedSet);
			for (const value of input.values())
				clonedSet.add(_clone(value));

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
				(clonedObject as any)[key] = _clone(input[key]);
		}

		return clonedObject as T;
	};

	return _clone(input);
};
