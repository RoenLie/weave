import { libConfig } from '@roenlie/vite-lib-config';


export default libConfig({
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
});
