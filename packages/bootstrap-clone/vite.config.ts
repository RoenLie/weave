import { /*componentAutoImporter,*/ libConfig } from '@roenlie/vite-lib-config';
import { defineConfig } from 'vite';


export default defineConfig(libConfig({
	plugins: [
		//componentAutoImporter({
		//	directories:   [ { path: './src/components' } ],
		//	prefixes:      [ /bs-/ ],
		//	loadWhitelist: [ /./ ],
		//	loadBlacklist: [ /\.demo/ ],
		//}),
	],
}));
