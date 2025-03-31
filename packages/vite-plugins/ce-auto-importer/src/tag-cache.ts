import { promises, readFileSync } from 'node:fs';
import path from 'node:path';


export const createTagCache = async (
	options: {
		directories: { path: string; whitelist?: RegExp[]; blacklist?: RegExp[]; }[];
		cache?:      Map<string, string>;
		pattern?:    RegExp[];
	},
): Promise<Map<string, string>> => {
	const { cache = new Map<string, string>() } = options;

	options.pattern = [
		...options.pattern ?? [],
		/@customElement\([`'"](.+?)[`'"]\)/g,
		/@injectableElement\([\n\t ]*[`'"](.+?)[`'"]/g,
		/customElements\s*\.define\(\s*[`'"](.*?)[`'"],/g,
	];

	/* scan for all files from directories after captured tag names */
	for (const { path, whitelist, blacklist } of options.directories) {
		let files = await genToArray(getFiles(path));

		files = files.filter(pth => {
			const whitelisted = whitelist?.some(reg => reg.test(pth));
			const blacklisted = blacklist?.some(reg => reg.test(pth));

			return whitelisted || !blacklisted;
		});

		for (const file of files) {
			const fileContent = readFileSync(file, { encoding: 'utf8' });
			options.pattern.forEach(expr => {
				fileContent.replaceAll(expr, (val, tag) => {
					cache.set(tag, file.replaceAll('\\', '/'));

					return val;
				});
			});
		}
	}

	return cache;
};


export const getUsedTags = (
	text: string,
	whitelist: RegExp[],
	tagExp = /<\/([\w-]+)>/g,
): Set<string> => {
	return new Set([ ...text.matchAll(tagExp) ]
		.map(([ _, tagName ]) => tagName)
		.filter((tag): tag is string => !!tag && whitelist.some(wl => wl.test(tag))));
};


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


/**
 * Convert a `generated` async iterable to an array promise.
 * This is the same as in @eyeshare/shared
 * duplicate put in here to avoid needing a dependency on shared.
 */
export async function genToArray<T>(generated: AsyncIterable<T>): Promise<T[]> {
	const out: T[] = [];
	for await (const x of generated)
		out.push(x);

	return out;
}
