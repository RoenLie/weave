import { libConfig } from '@roenlie/vite-lib-config';
import { componentAutoImporter } from '@roenlie/vite-plugin-ce-auto-import';
import { importCSSSheet } from '@roenlie/vite-plugin-import-css-sheet';


export default libConfig({
	esbuild: {
		minifyIdentifiers: false,
	},
	plugins: [
		componentAutoImporter({
			directories:   [ { path: './src/components' } ],
			prefixes:      [ /mm-/ ],
			loadWhitelist: [ /./ ],
			loadBlacklist: [ /\.demo/ ],
		}),
		importCSSSheet(),
	],
});
