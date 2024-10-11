import { glob, writeFile } from 'node:fs/promises';

import { bundleAsync } from 'lightningcss';
import type { Plugin, ResolvedConfig } from 'vite';


/** Minifies any css file found in the build output. */
export const minifyCssAssets = (): Plugin => {
	let config: ResolvedConfig;

	return {
		name:           'vite-minify-css-assets',
		configResolved: (cfg) => {
			config = cfg;
		},
		closeBundle: async () => {
			const searchDir = config.build.outDir;

			const cssFileIterator = glob(`${ searchDir }/**/*.css`);
			for await (const file of cssFileIterator) {
				const { code } = await bundleAsync({
					minify:   true,
					filename: file,
				});

				writeFile(file, code);
			}
		},
	};
};
