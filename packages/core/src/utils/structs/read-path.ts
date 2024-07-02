import type { PathOf, PathValue } from '../../types/path-types.js';


/**
 * Read a value of the `source` from the `path`.
 * @param object The object to read from.
 * @param path The object path to read from.
 * @remarks You're not supposed to pass type parameters explicitly. They should be inferred from the `source` argument.
 */
export const readPath = <
	TObject extends Record<PropertyKey, any>,
	TPath extends PathOf<TObject>,
	TValue extends PathValue<TObject, TPath>,
>(
	object: TObject,
	path: TPath,
): TValue => {
	if (!path)
		throw new Error('path must be non-empty', { cause: path });

	let rec = object;
	for (const segment of path.split('.')) {
		// If there is no object to traverse for a given segment,
		// it must be an optional property, and so undefined is a valid path value.
		if (typeof rec !== 'object' || rec === null)
			return undefined as any;

		rec = rec[segment];
	}

	return rec as any;
};
