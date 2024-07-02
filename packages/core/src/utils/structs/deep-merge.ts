/**
 * Recursively merges two or more objects or arrays.
 */
export const deepMerge = <T extends Record<keyof any, any> | any[]>(
	objects: Partial<T>[],
	options: { array?: 'merge' | 'extend' | 'override' } = {},
): T => {
	const merged: any = Array.isArray(objects[0]) ? [] : {};
	const { array = 'extend' } = options;

	const isPlainObject = (value: any) =>
		Object.prototype.toString.call(value) === '[object Object]';

	const handleArray = (obj: Partial<T> & any[]) => {
		if (array === 'merge') {
			obj.forEach((value: any, index: number) => {
				if (merged[index] === undefined)
					merged[index] = value;
				else if (isPlainObject(value))
					merged[index] = deepMerge([ merged[index], value ], options);
				else
					merged[index] = value;
			});
		}
		else if (array === 'override') {
			merged.length = 0;
			merged.push(...obj);
		}
		else {
			merged.push(...obj);
		}
	};

	const handleObject = (obj: Partial<T>) => {
		for (const [ key, value ] of Object.entries(obj)) {
			if (isPlainObject(value)) {
				merged[key] = deepMerge([ merged[key] ?? {}, value ], options);
			}
			else if (Array.isArray(value)) {
				if (array == 'merge') {
					merged[key] = value.map((val, index) => {
						return merged[key]?.[index] !== undefined && isPlainObject(val)
							? deepMerge([ merged[key][index], val ], options)
							: val;
					});
				}
				else if (array === 'override') {
					merged[key] = [ ...value ];
				}
				else {
					merged[key] = [ ...(merged[key] ?? []), ...value ];
				}
			}
			else {
				merged[key] = value;
			}
		}
	};

	for (const obj of objects) {
		if (Array.isArray(obj))
			handleArray(obj);
		else if (isPlainObject(obj))
			handleObject(obj);
		else
			throw new Error('Cannot merge non-object/array types');
	}

	return merged;
};
