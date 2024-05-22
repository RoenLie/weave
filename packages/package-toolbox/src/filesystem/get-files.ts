import { promises } from 'node:fs';
import path from 'node:path';


/**
 * Async generator for retrieving file paths matching a `pattern` in a `directory` using Node.JS.
 * Includes sub folders.
 */
export async function* getFiles(
	directory: string,
	pattern?: RegExp,
): AsyncGenerator<string, void, string | undefined> {
	const dirents = await promises.readdir(directory, { withFileTypes: true });
	for (const dirent of dirents) {
		const res = path.resolve(directory, dirent.name);
		if (dirent.isDirectory())
			yield* getFiles(res, pattern);
		else if (pattern?.test(res) ?? true)
			yield res;
	}
}
