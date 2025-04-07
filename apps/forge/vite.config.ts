import { viteCopy } from '@roenlie/vite-plugin-copy';
import { importCSSSheet } from '@roenlie/vite-plugin-import-css-sheet';
import { defineConfig } from 'vite';


export default defineConfig((env) => ({
	root:      './src',
	publicDir: '../public',
	plugins:   [
		importCSSSheet(),
		viteCopy({
			targets: [
				{
					from: './node_modules/@roenlie/elements/styles/*',
					to:   './public/vendor/mimic-elements',
				},
			],
			hook:     'config',
			copyOnce: true,
		}),
	],
	resolve: {
		conditions: env.mode === 'development'
			? [ 'morph-workspace' ] : [],
	},
}));
