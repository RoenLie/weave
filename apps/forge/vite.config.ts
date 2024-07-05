import { viteCopy } from '@roenlie/package-toolbox/vite-utils';
import { keystone } from 'keystone-vite';
import { defineConfig } from 'vite';
import { importCSSSheet } from '@roenlie/vite-plugin-import-css-sheet';


export default defineConfig((env) => ({
	root:      './src',
	publicDir: '../public',
	plugins:   [
		keystone(),
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
