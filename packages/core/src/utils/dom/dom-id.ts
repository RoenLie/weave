import { customAlphabet, nanoid } from 'nanoid';


/**
 * Generate unique ID using the case sensitive english alphabet a-z, A-Z for the first character and a nonoid for the remainder.
 * Optionally pass a `prefix`.
 *
 * By default, the ID will have 21 symbols to have a collision probability similar to UUID v4.
 */
export const domId = (length = 21, prefix = '') => {
	const id = prefix + alphabetId(1) + nanoid(length - 1);

	return prefix ? prefix + '-' + id : id;
};


/**
 * Generate unique ID using the case sensitive english alphabet a-z, A-Z.
 *
 * By default, the ID will have 21 symbols to have a collision probability similar to UUID v4.
 */
export const alphabetId = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
