import { libConfig } from '@roenlie/vite-lib-config';


export default libConfig({
	build: {
		outDir: './dist/lib',
	},
	worker: {
		format: 'es',
	},
});
