export interface Change { path: string; oldValue?: any; newValue?: any; }


export const getObjectDiff = (
	obj1: Record<keyof any, any>,
	obj2?: Record<keyof any, any>,
): Change[] => {
	const visitedObjects = new WeakSet();

	return internalObjectDiff(obj1, obj2, '', visitedObjects);
};


const isObject = (obj: any): obj is object =>
	typeof obj === 'object' && obj !== null;

const isEqual = (key: string, a: any, b: any): boolean =>
	a[key] !== b?.[key];


const internalObjectDiff = (
	obj1: Record<keyof any, any>,
	obj2: Record<keyof any, any> | undefined,
	parentKey: string,
	circularCache: WeakSet<any>,
): Change[] => {
	if (circularCache.has(obj1) || (obj2 && circularCache.has(obj2)))
		return [];

	const changedKeys: Change[] = [];

	circularCache.add(obj1);
	if (obj2)
		circularCache.add(obj2);

	console.log('isArray', Array.isArray(obj1), obj1);


	// Check keys in obj1
	for (const [ key, value ] of Object.entries(obj1)) {
		const currentKey = parentKey ? parentKey + '.' + key : key;

		if (isObject(value) && isObject(obj2?.[key])) {
			const nestedChanges =
				internalObjectDiff(value, obj2[key], currentKey, circularCache);

			changedKeys.push(...nestedChanges);
		}
		else if (isEqual(key, obj1, obj2)) {
			if (isObject(value)) {
				const nestedChanges =
					internalObjectDiff(value, {}, currentKey, circularCache);

				changedKeys.push(...nestedChanges);
			}
			else if (isObject(obj2?.[key])) {
				const nestedChanges =
					internalObjectDiff(obj2[key], {}, currentKey, circularCache);

				changedKeys.push(...nestedChanges);
			}
			else {
				changedKeys.push({
					path:     currentKey,
					oldValue: value,
					newValue: obj2?.[key],
				});
			}
		}
	}

	// Check keys in obj2 that are not in obj1
	for (const [ key, value ] of Object.entries(obj2 ?? {})) {
		// Skip keys that are already checked in obj1
		if (obj1.hasOwnProperty(key))
			continue;

		const currentKey = parentKey ? `${ parentKey }.${ key }` : key;

		if (isObject(value)) {
			const nestedChanges =
				internalObjectDiff({}, value, currentKey, circularCache);

			changedKeys.push(...nestedChanges);
		}
		else {
			changedKeys.push({
				path:     currentKey,
				oldValue: undefined,
				newValue: value,
			});
		}
	}

	return changedKeys;
};
