import { libConfig } from '@roenlie/package-toolbox/vite-utils';
import { defineConfig } from 'vitest/config';


export default defineConfig(libConfig({
	build: {
		outDir: './dist/lib',
		minify: false,
	},
}));
