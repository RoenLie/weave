import { promises } from 'node:fs';
import { resolve } from 'node:path';


/**
 * Async generator for retrieving file paths matching a `regexp` in a directory.
 * Includes sub folders.
 */
export async function* getFiles(
	directory: string,
	pattern?: RegExp,
): AsyncGenerator<string, void, string | undefined> {
	const dirents = await promises.readdir(directory, { withFileTypes: true });
	for (const dirent of dirents) {
		const res = resolve(directory, dirent.name);
		if (dirent.isDirectory())
			yield* getFiles(res, pattern);
		else if (pattern?.test(res) ?? true)
			yield res;
	}
}


/**
 * Convert a `generated` async iterable to an array promise.
 */
export async function genToArray<T>(generated: AsyncIterable<T>): Promise<T[]> {
	const out: T[] = [];
	for await (const x of generated)
		out.push(x);

	return out;
}
