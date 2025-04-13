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
) => {
	const changedKeys: Change[] = [];

	if (circularCache.has(obj1) || (obj2 && circularCache.has(obj2))) {
		return changedKeys;
	}
	else {
		circularCache.add(obj1);
		obj2 && circularCache.add(obj2);
	}

	// Check keys in obj1
	for (const key in obj1) {
		if (!obj1.hasOwnProperty(key))
			continue; // Skip inherited properties

		const currentKey = parentKey ? `${ parentKey }.${ key }` : key;

		if (isObject(obj1[key]) && isObject(obj2?.[key])) {
			const nestedChanges =
				internalObjectDiff(obj1[key], obj2[key], currentKey, circularCache);

			changedKeys.push(...nestedChanges);
		}
		else if (isEqual(key, obj1, obj2)) {
			if (isObject(obj1[key])) {
				const nestedChanges =
					internalObjectDiff(obj1[key], {}, currentKey, circularCache);

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
					oldValue: obj1[key],
					newValue: obj2?.[key],
				});
			}
		}
	}

	// Check keys in obj2 that are not in obj1
	for (const key in obj2) {
		if (!obj2.hasOwnProperty(key))
			continue; // Skip inherited properties
		if (obj1.hasOwnProperty(key))
			continue; // Skip keys that are already checked in obj1

		const currentKey = parentKey ? `${ parentKey }.${ key }` : key;

		if (isObject(obj2[key])) {
			const nestedChanges =
				internalObjectDiff({}, obj2[key], currentKey, circularCache);

			changedKeys.push(...nestedChanges);
		}
		else {
			changedKeys.push({
				path:     currentKey,
				oldValue: undefined,
				newValue: obj2[key],
			});
		}
	}

	return changedKeys;
};
