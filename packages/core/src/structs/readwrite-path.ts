// Optional cache for frequently used paths
const pathCache: Map<string, string[]> = new Map();


/**
 * Read a value of the `source` from the `path`.
 * @param target The object to read from.
 * @param path The object path to read from.
 */
export const readPath = <T>(
	target: Record<keyof any, any>,
	path: string,
	options: { useCache?: boolean; } = {},
): T => {
	// Use cached segments if available and caching is enabled
	const segments = options.useCache && pathCache.has(path as string)
		? pathCache.get(path as string)!
		: (path as string).split('.');

	// Cache the segments if caching is enabled
	if (options.useCache && !pathCache.has(path as string))
		pathCache.set(path as string, segments);

	let rec = target;
	for (const segment of path.split('.')) {
		// If there is no object to traverse for a given segment,
		// it must be an optional property, and so undefined is a valid path value.
		if (typeof rec !== 'object' || rec === null)
			return undefined as any;

		// Handle array indices (convert numeric strings to numbers for array access)
		const key = Array.isArray(rec) && /^\d+$/.test(segment)
			? parseInt(segment, 10)
			: segment;

		rec = rec[key];
	}

	return rec as any;
};


/**
 * Write a `value` to the `target` at the `path`.
 * @param target The object to write to.
 * @param path The object path to write to.
 * @param value The value to write.
 */
export const writePath = (
	target: Record<keyof any, any>,
	path: string,
	value: any,
	options: {
		useCache?:              boolean;
		createMissingSegments?: boolean;
		deleteIfUndefined?:     boolean;
	} = {},
): boolean => {
	// Use cached segments if available and enabled
	const segments = options.useCache && pathCache.has(path)
		? pathCache.get(path)!
		: path.split('.');

	// Cache the segments if enabled
	if (options.useCache && !pathCache.has(path))
		pathCache.set(path, segments);

	let rec = target as Record<PropertyKey, any>;

	// Navigate to the parent of the target property
	for (let i = 0; i < segments.length - 1; i++) {
		const segment = segments[i]!;

		// Handle array indices
		const key = Array.isArray(rec) && /^\d+$/.test(segment)
			? parseInt(segment, 10)
			: segment;

		// Create missing segments if option is enabled
		if (options.createMissingSegments && rec[key] === undefined) {
			// Determine if next segment is an array index
			const nextSegment = segments[i + 1];
			const isNextSegmentArrayIndex = nextSegment && /^\d+$/.test(nextSegment);
			rec[key] = isNextSegmentArrayIndex ? [] : {};
		}

		if (!rec[key] && typeof rec[key] !== 'boolean' && rec[key] !== 0)
			return false;

		rec = rec[key];
	}

	const lastSegment = segments[segments.length - 1]!;
	const finalKey = Array.isArray(rec) && /^\d+$/.test(lastSegment)
		? parseInt(lastSegment, 10)
		: lastSegment;

	// Handle undefined with delete option
	if (value === undefined && options.deleteIfUndefined)
		delete rec[finalKey];
	else
		rec[finalKey] = value;

	return true;
};


// Optional helper to clear cache if memory usage is a concern
export const clearPathCache = (): void => {
	pathCache.clear();
};
