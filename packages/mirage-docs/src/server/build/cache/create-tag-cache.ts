import { readFileSync } from 'node:fs';

import { genToArray, getFiles } from '../helpers/get-files.js';


export const createTagCache = async (options: {
	directories: { path: string; whitelist?: RegExp[]; blacklist?: RegExp[] }[];
	componentTagCache?: Map<string, string>;
	tagCapturePatterns?: RegExp[];
}) => {
	const { componentTagCache = new Map<string, string>() } = options;

	options.tagCapturePatterns = [
		...options.tagCapturePatterns ?? [],
		/@customElement\([`'"](.+?)[`'"]\)/g,
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
			const normalizedFileName = file.replaceAll('\\', '/');

			// Extract tags from HTMLElementTagNameMap interfaces in file.
			fileContent.replaceAll(/HTMLElementTagNameMap.*?{(.*?)}/gs, (val, capture: string) => {
				capture.replaceAll(/([-\w]+)['"]/g, (val, tag: string) => {
					if (!/[^-\w]/.test(tag))
						componentTagCache.set(tag, normalizedFileName);

					return val;
				});

				return val;
			});

			// Extract tags from the supplied tag capture patterns.
			options.tagCapturePatterns.forEach(expr => {
				fileContent.replaceAll(expr, (val, tag) => {
					componentTagCache.set(tag, normalizedFileName);

					return val;
				});
			});
		}
	}

	return componentTagCache;
};


export class TagCatcher {

	// Searches for tags that contain a hypen ( - ).
	protected static tagExpr = /<\/(\w+-[\w-]+)>/g;

	public static get(...text: string[]) {
		const tags = new Set<string>();
		for (const txt of text)
			txt.replaceAll(TagCatcher.tagExpr, (s: string, c1: string) => (tags.add(c1), s));

		return [ ...tags ];
	}

}
