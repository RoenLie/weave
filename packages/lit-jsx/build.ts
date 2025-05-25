import fs from 'node:fs/promises';
import { join as joinPosix } from 'node:path/posix';

import { build as viteBuild, type UserConfig } from 'vite';


export const build = async (pkgDir: string): Promise<void> => {
	pkgDir = pkgDir.replaceAll('\\', '/');

	const outdir = joinPosix(pkgDir, 'dist');

	const pkgJson = await fs.readFile(pkgDir + '/package.json', 'utf8');
	const parsedPkg = JSON.parse(pkgJson);
	const packageName = parsedPkg.name;

	const result = fs.glob(joinPosix(pkgDir, 'src/**/*.ts'));
	const files = await Array.fromAsync(result);

	console.info(packageName + ': Cleaning previous build...');
	await fs.rm(outdir, { recursive: true, force: true });

	/**
	Matches strings that look like package names\
	(e.g., node:fs, lodash, \@scope/package) but not absolute or relative paths.
	 */
	const expression = /^(?!\w+:[/\\])@?[\w]+[\w\-/.:]+$/;

	const cfg: UserConfig = {
		publicDir: false,
		build:     {
			outDir:      outdir,
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
	};

	console.info(packageName + ': Building...');
	await viteBuild(cfg);

	console.info(packageName + ': Done');
};
