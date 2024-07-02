import { globby } from 'globby';
import { resolve } from 'path';
import { defineConfig, type UserConfig } from 'vite';


const root = resolve(resolve(), 'src');
const outDir = resolve(resolve(), 'dist/workers');


export default defineConfig(async (): Promise<UserConfig> => {
	const input = (await globby('./src/workers/**/!(*.(test|demo|editor|types)).ts'));

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
			emptyOutDir: true,
			minify:      true,
			sourcemap:   true,
			lib:         {
				entry:   input,
				formats: [ 'es' ],
			},
			rollupOptions: {
				input,
			},
		},
	};
});
