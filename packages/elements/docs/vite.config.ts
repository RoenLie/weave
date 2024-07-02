import { defineDocConfig } from '@roenlie/mirage-docs/server';
import { importCSSSheet } from 'vite-plugin-import-css-sheet';


export default defineDocConfig(
	() => {
		return {
			base:       '',
			root:       '/docs',
			source:     '/docs/pages',
			siteConfig: {
				root: {
					layout: {
						headingText: 'Mimic Elements',
						logoSrc:     'logo.svg',
					},
					styleOverrides: {
						sidebar: `
						.greeting .title {
							width: min-content;
						}
						`,
					},
				},
				pages: {
					scripts: [ { src: '/bootstrap.ts' } ],
				},
			},
		};
	},
	env => {
		return {
			resolve: {
				conditions: env.mode === 'development' ? [ 'mimic-workspace' ] : [],
			},
			build: {
				outDir: './dist/docs',
			},
			esbuild: {
				tsconfigRaw: {
					compilerOptions: {
						experimentalDecorators: true,
					},
				},
			},
			plugins: [ importCSSSheet() ],
		};
	},
);
