const isPlainObject = (value: any): value is Record<PropertyKey, any> =>
	Object.prototype.toString.call(value) === '[object Object]';


const handleArray = (
	merged: Record<PropertyKey, any> | any[],
	obj: any[],
	options: { array?: 'merge' | 'extend' | 'override'; },
) => {
	if (options.array === 'merge') {
		obj.forEach((value: any, index: number) => {
			if (merged[index] === undefined)
				merged[index] = value;
			else if (isPlainObject(value))
				merged[index] = deepMerge([ merged[index], value ], options);
			else
				merged[index] = value;
		});
	}
	else if (options.array === 'override') {
		merged.length = 0;
		merged.push(...obj);
	}
	else {
		merged.push(...obj);
	}
};


const handleObject = (
	merged: Record<PropertyKey, any> | any[],
	obj: Record<PropertyKey, any>,
	options: { array?: 'merge' | 'extend' | 'override'; },
) => {
	for (const [ key, value ] of Object.entries(obj)) {
		// Javascript allows indexing arrays with strings, but typescript does not.
		// Therefor we cast the key to a number to make typescript happy.
		const fakeKey = key as unknown as number;

		if (isPlainObject(value)) {
			merged[fakeKey] = deepMerge([ merged[fakeKey] ?? {}, value ], options);
		}
		else if (Array.isArray(value)) {
			if (options.array == 'merge') {
				merged[fakeKey] = value.map((val, index) => {
					return merged[fakeKey]?.[index] !== undefined && isPlainObject(val)
						? deepMerge([ merged[fakeKey][index], val ], options)
						: val;
				});
			}
			else if (options.array === 'override') {
				merged[fakeKey] = [ ...value ];
			}
			else {
				merged[fakeKey] = [ ...(merged[fakeKey] ?? []), ...value ];
			}
		}
		else {
			merged[fakeKey] = value;
		}
	}
};


/**
 * Recursively merges two or more objects or arrays.
 */
export const deepMerge = <T extends Record<keyof any, any> | any[]>(
	objects: Partial<T>[],
	options: { array?: 'merge' | 'extend' | 'override'; } = {},
): T => {
	const merged: Record<PropertyKey, any> | [] = Array.isArray(objects[0]) ? [] : {};
	options.array ??= 'extend';

	for (const obj of objects) {
		if (Array.isArray(obj))
			handleArray(merged, obj, options);
		else if (isPlainObject(obj))
			handleObject(merged, obj, options);
		else
			throw new Error('Cannot merge non-object/array types');
	}

	return merged as T;
};
