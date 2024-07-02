import { defineDocConfig } from '@roenlie/mirage-docs/server';


export default defineDocConfig(
	_ => {
		return {
			base:       '/mirage-docs',
			root:       '/',
			source:     '/src/pages',
			siteConfig: {
				root: {
					layout: {
						headingText: 'Mirage Docs',
						logoHeight:  '40px',
						logoSrc:     'logo.svg',
					},
				},
				pages: {
					scripts: [
						{
							src: '/bootstrap-page.ts',
						},
					],
				},
			},
			autoImport: {
				tagPrefixes:   [ 'mm' ],
				loadWhitelist: [ /\.ts/ ],
			},
		};
	},
	_ => {
		return {
			build: {
				emptyOutDir: true,
				outDir:      './dist',
			},
		};
	},
);
