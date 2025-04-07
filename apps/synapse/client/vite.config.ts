import { importCSSSheet } from '@roenlie/vite-plugin-import-css-sheet';
import { defineConfig } from 'vite';


export default defineConfig({
	plugins: [ importCSSSheet() ],
});
