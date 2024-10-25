import { glob, writeFile } from 'node:fs/promises';

import { bundleAsync } from 'lightningcss';
import type { Plugin, ResolvedConfig } from 'vite';


/** Minifies any css file found in the build output. */
export const minifyCssAssets = (dir?: string): Plugin => {
	let config: ResolvedConfig;

	return {
		name:           '@roenlie/vite-minify-css-assets',
		configResolved: cfg => {
			config = cfg;
		},
		closeBundle: async () => {
			const searchDir = dir ?? config.build.outDir;

			const cssFileIterator = glob(`${ searchDir }/**/*.css`);
			for await (const file of cssFileIterator) {
				try {
					const { code } = await bundleAsync({
						minify:   true,
						filename: file,
					});
	
					await writeFile(file, code);
				}
				catch (err) {
					console.error(err);
				}
			}
		},
	};
};
