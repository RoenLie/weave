import { importCSSSheet } from '@roenlie/vite-plugin-import-css-sheet';
import tailwindcss from '@tailwindcss/vite';
import { litJsx } from 'jsx-lit/vite-jsx-preserve';
import { defineConfig } from 'vite';


export default defineConfig({
	plugins: [ litJsx(), tailwindcss(), importCSSSheet() ],
});
