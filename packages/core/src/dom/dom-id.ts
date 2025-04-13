import { customAlphabet } from 'nanoid';

export * from 'nanoid';


/**
 * Generate unique ID using the case sensitive english alphabet a-z,
 * A-Z for the first character and a nonoid for the remainder.
 * Optionally pass a `prefix`.
 *
 * By default, the ID will have 21 symbols to have a collision probability similar to UUID v4.
 */
export const domId = (length = 21, prefix = ''): string => {
	const id = prefix + alphabetId(length);

	return prefix ? prefix + '-' + id : id;
};


/**
 * Generate unique ID using the case sensitive english alphabet a-z, A-Z.
 *
 * By default, the ID will have 21 symbols to have a collision probability similar to UUID v4.
 */
export const alphabetId = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
