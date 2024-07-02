import { libConfig } from '@roenlie/package-toolbox/vite-utils';
import { defineConfig } from 'vite';


export default defineConfig(libConfig({
	build: {
		emptyOutDir: true,
		lib:         {
			entry:    './src/index.ts',
			fileName: 'index',
		},
		rollupOptions: {
			output: {
				preserveModules: false,
			},
		},
	},
}));
