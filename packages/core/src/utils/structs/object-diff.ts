export interface Change { path: string; oldValue?: any; newValue?: any; }


export const getObjectDiff = (
	obj1: Record<keyof any, any>,
	obj2?: Record<keyof any, any>,
): Change[] => {
	const visitedObjects = new WeakSet();

	return internalObjectDiff(obj1, obj2, '', visitedObjects);
};


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
		const currentKey = parentKey ? `${ parentKey }.${ key }` : key;

		if (typeof obj1[key] === 'object' && typeof obj2?.[key] === 'object') {
			const nestedChanges = internalObjectDiff(
				obj1[key],
				obj2[key],
				currentKey,
				circularCache,
			);
			changedKeys.push(...nestedChanges);
		}
		else if (obj1[key] !== obj2?.[key]) {
			if (typeof obj1[key] === 'object') {
				const nestedChanges = internalObjectDiff(
					obj1[key],
					{},
					currentKey,
					circularCache,
				);
				changedKeys.push(...nestedChanges);
			}
			else if (typeof obj2?.[key] === 'object') {
				const nestedChanges = internalObjectDiff(obj2[key],
					{},
					currentKey,
					circularCache);
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
		const currentKey = parentKey ? `${ parentKey }.${ key }` : key;

		if (!obj1.hasOwnProperty(key)) {
			if (typeof obj2[key] === 'object') {
				const nestedChanges = internalObjectDiff(
					{},
					obj2[key],
					currentKey,
					circularCache,
				);
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
	}

	return changedKeys;
};
