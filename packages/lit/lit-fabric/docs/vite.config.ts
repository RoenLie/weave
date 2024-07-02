import { defineDocConfig } from '@roenlie/mirage-docs/server';


export default defineDocConfig(
	() => {
		return {
			base:       '',
			root:       '/docs',
			source:     '/docs/pages',
			siteConfig: {
				pages: {
					scripts: [ { src: '/bootstrap.ts' } ],
				},
			},
		};
	},
	() => {
		return {
			build: {
				outDir: './dist/preview',
			},
		};
	},
);
