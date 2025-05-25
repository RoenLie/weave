import fs from 'node:fs/promises';
import { join as joinPosix, resolve } from 'node:path/posix';

import { defineConfig, type UserConfig } from 'vite';

/**
Matches strings that look like package names\
(e.g., node:fs, lodash, \@scope/package) but not absolute or relative paths.
*/
const expression = /^(?!\w+:[/\\])@?[\w]+[\w\-/.:]+$/;


export default defineConfig(async () => {
	const pkgDir = resolve();

	const result = fs.glob(joinPosix(pkgDir, 'src/**/*.ts'));
	const files = await Array.fromAsync(result);

	return {
		publicDir: false,
		build:     {
			outDir:      './dist',
			emptyOutDir: false,
			sourcemap:   true,
			lib:         {
				entry:   files,
				formats: [ 'es' ],
			},
			rollupOptions: {
				external(source) {
					return expression.test(source);
				},
				output: {
					preserveModules:     true,
					preserveModulesRoot: 'src',
				},
			},
		},
	} satisfies UserConfig;
});
