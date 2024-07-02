import fs, { readFileSync } from 'fs';
import path from 'path';


/**
 * Async generator for retrieving file paths matching a `pattern` in a `directory` using Node.JS.
 * Includes sub folders.
 */
async function* getFiles(directory: string, pattern?: RegExp): AsyncGenerator<string, void, string | undefined> {
	const dirents = await fs.promises.readdir(directory, { withFileTypes: true });
	for (const dirent of dirents) {
		const res = path.resolve(directory, dirent.name);
		if (dirent.isDirectory())
			yield* getFiles(res, pattern);
		else if (pattern?.test(res) ?? true)
			yield res;
	}
}

/**
 * Convert a `generated` async iterable to an array promise.
 * This is the same as in @eyeshare/shared
 * duplicate put in here to avoid needing a dependency on shared.
 */
async function genToArray<T>(generated: AsyncIterable<T>): Promise<T[]> {
	const out: T[] = [];
	for await (const x of generated)
		out.push(x);

	return out;
}


export const getPackagePaths = async () => {
	// Get all workspace package.json files
	const packages = (await genToArray(getFiles('.', /package\.json/))).filter(p => !p.includes('node_modules'));
	const projectPathCache = new Map<string, string>(packages.map(p => {
		const content = readFileSync(p, { encoding: 'utf8' });
		const name = JSON.parse(content).name;
		const path = p.replace('/package.json', '').replace('\\package.json', '');

		return [ name, path ];
	}));

	return {
		packages,
		projectPathCache,
	};
};
