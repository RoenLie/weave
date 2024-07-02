import { libConfig } from '@roenlie/package-toolbox/vite-utils';
import { defineConfig } from 'vite';


export default defineConfig(async (env) => {
	const cfg = await libConfig({
		build: {
			outDir: './dist/lib',
			minify: false,
		},
	})(env);

	const lib = cfg.build?.lib;
	if (lib && Array.isArray(lib.entry))
		lib.entry = lib.entry.filter(entry => !entry.includes('_demo'));

	return cfg;
});
