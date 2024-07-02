import { getExternalImportPaths } from '@roenlie/package-toolbox/filesystem/get-import-paths.js';
import { globby } from 'globby';
import { resolve } from 'path';
import { defineConfig, type UserConfig } from 'vite';


const root = resolve(resolve(), 'src');
const outDir = resolve(resolve(), 'dist');


export default defineConfig(async (): Promise<UserConfig> => {
	const externalImportPaths = await getExternalImportPaths('./src');
	const inputApp = (await globby('./src/app/**/!(*.(test|demo|editor|types)).ts'));
	const inputServer = (await globby('./src/server/**/!(*.(test|demo|editor|types)).ts'));
	const input = [ ...inputApp, ...inputServer ];

	return {
		root,
		esbuild: {
			tsconfigRaw: {
				compilerOptions: {
					experimentalDecorators: true,
				},
			},

		},
		build: {
			outDir,
			minify:    false,
			sourcemap: true,
			lib:       {
				entry:   input,
				formats: [ 'es' ],
			},
			rollupOptions: {
				input,
				external: externalImportPaths,

				output: {
					/** By preseving modules, we retain the folder structure of the original source, thereby allowing
					 *  generated d.ts files to be correctly picked up. */
					preserveModules: true,

					/** We remove src from any module paths to preserve the folder structure incase any virtual or node_modules
					 *  files are included */
					preserveModulesRoot: 'src',

					/** We rename the file path to the file name and .js
					 *  If we don't do this, in combination with preserve modules, we end up with double file paths. */
					entryFileNames: (entry) => `${ entry.name }.js`,
				},
			},
		},
	};
});
