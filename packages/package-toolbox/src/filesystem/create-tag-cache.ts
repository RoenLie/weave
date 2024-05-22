import fs from 'fs';

import { genToArray } from '../utils/gen-to-array.js';
import { getFiles } from './get-files.js';


export const createTagCache = async (options: {
	directories: { path: string; whitelist?: RegExp[]; blacklist?: RegExp[] }[];
	cache?: Map<string, string>;
	pattern?: RegExp[];
}) => {
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
			const fileContent = fs.readFileSync(file, { encoding: 'utf8' });
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
) => {
	return new Set([ ...text.matchAll(tagExp) ]
		.map(([ _, tagName ]) => tagName)
		.filter((tag): tag is string => !!tag && whitelist.some(wl => wl.test(tag))));
};
