import { defineConfig } from 'vite';
//import mkcert from 'vite-plugin-mkcert';
import { importCSSSheet } from '@roenlie/vite-plugin-import-css-sheet';


export default defineConfig({
	plugins: [
		//mkcert(),
		importCSSSheet(),
	],
});
