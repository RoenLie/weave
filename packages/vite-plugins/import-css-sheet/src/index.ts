import type { Plugin } from 'vite';

import { ImportCSSSheet } from './import-css-sheet.js';


export const importCSSSheet = (options?: Partial<{
	transformers:   ((code: string, id: string) => string)[];
	additionalCode: string[];
	minify:         boolean;
}>): Plugin => {
	const {
		transformers = [],
		additionalCode = [],
		minify = true,
	} = options ?? {};

	let importSheet: ImportCSSSheet;

	return {
		enforce: 'pre',
		name:    '@roenlie/vite-plugin-import-css-sheet',
		configResolved(config) {
			importSheet = new ImportCSSSheet(
				config,
				transformers,
				additionalCode,
				minify,
			);
		},
		resolveId(source, importer, options) {
			return importSheet.resolveId(this, source, importer, options);
		},
		load(id, options) {
			return importSheet.load(this, id, options);
		},
		buildEnd() {
			if (config.mode !== 'development') {
				const { totalBeforeMinify, totalAfterMinify } = importSheet;
				console.log('@roenlie/vite-plugin-import-css-sheet');
				console.log('Minified css sheet by', totalBeforeMinify - totalAfterMinify, 'characters.');
				console.log('Before minify:', totalBeforeMinify, '. After minify:', totalAfterMinify);
			}
		}
	};
};
