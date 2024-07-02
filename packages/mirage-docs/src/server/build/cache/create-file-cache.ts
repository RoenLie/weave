import Path from 'node:path';

import { genToArray, getFiles } from '../helpers/get-files.js';


export type FilePathCache = Map<string, string> & {
	recreate: () => Promise<void>;
}


export const createFileCache = async (options: {
	directories: { path: string; pattern: RegExp }[];
	cache?: Map<string, string>;
}): Promise<FilePathCache> => {
	const { cache = new Map<string, string>() } = options;

	for (const { path, pattern } of options.directories) {
		const files = await genToArray(getFiles(path, pattern));

		for (const file of files.filter(pth => pattern.test(pth))) {
			const name = Path.parse(file).name;
			cache.set(name, file.replaceAll('\\', '/'));
		}
	}

	const fileCache = cache as FilePathCache;
	fileCache.recreate = async () => {
		cache.clear();
		await createFileCache({ ...options, cache: cache });
	};

	return fileCache;
};
