import type { PathOf, PathValue } from '../../types/path-types.js';


/**
 * Write a `value` to the `target` at the `path`.
 * @param object The object to write to.
 * @param path The object path to write to.
 * @param value The value to write.
 * @returns Whether the value could be written to the path. (When part of the path is null | undefined it cannot be written.)
 * @remarks You're not supposed to pass type parameters explicitly. They should be inferred from the `target` argument.
 */
export const writePath = <
	TObject extends object,
	TPath extends PathOf<TObject>,
	TValue extends PathValue<TObject, TPath>,
>(
	object: TObject,
	path: TPath,
	value: TValue,
) => {
	let rec = object as Record<PropertyKey, any>;

	const segments = path.split('.');
	for (let i = 0; i < segments.length - 1; i++) {
		const segment = segments[i]!;
		if (!rec[segment])
			return false;

		rec = rec[segment];
	}

	rec[segments[segments.length - 1]!] = value;

	return true;
};
