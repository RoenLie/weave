import { defineDocConfig } from '@roenlie/mirage-docs/server';


export default defineDocConfig(
	() => {
		return {
			base:       '',
			root:       '/docs',
			source:     '/docs/pages',
			autoImport: {
				tagPrefixes:   [ 'mm' ],
				loadWhitelist: [ /\.ts/ ],
			},
			siteConfig: {
				root: {
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
	() => {
		return {
			build: {
				outDir: './dist',
			},
		};
	},
);
