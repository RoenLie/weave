import { litJsx } from '@roenlie/lit-jsx/vite';
import { importCSSSheet } from '@roenlie/vite-plugin-import-css-sheet';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';


export default defineConfig({
	plugins: [ litJsx(), tailwindcss(), importCSSSheet() ],
});
