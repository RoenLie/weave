import { defineDocConfig } from '@roenlie/mirage-docs/server';


export default defineDocConfig(
	_ => {
		return {
			base:       '/mirage-docs',
			root:       '/',
			source:     '/src/pages',
			siteConfig: {
				root: {
					darkTheme:  [ 'root-dark.css' ],
					lightTheme: [ 'root-light.css' ],
					layout:     {
						headingText: 'Mirage Docs',
						logoSrc:     'logo.svg',
					},
				},
				pages: {
					darkTheme:  [ 'dark.css' ],
					lightTheme: [ 'light.css' ],
					scripts:    [
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
