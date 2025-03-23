import { defineDocConfig } from '@roenlie/mirage-docs/server';


export default defineDocConfig(
	() => {
		return {
			base:       '',
			root:       '/docs',
			source:     '/src/components',
			siteConfig: {
				root: {
					layout: {
						headingText: 'Elements',
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
			autoImport: {
				tagPrefixes:   [ 'bs-' ],
				loadWhitelist: [ /\.ts/ ],
			},
		};
	},
	env => {
		return {
			build: {
				outDir: './dist/docs',
			},
			esbuild: {
				target: 'es2024',
			},
			plugins: [],
		};
	},
);
