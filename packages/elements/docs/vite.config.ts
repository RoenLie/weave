import { defineDocConfig } from '@roenlie/mirage-docs/server';
import { importCSSSheet } from '@roenlie/vite-plugin-import-css-sheet';


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
