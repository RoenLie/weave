import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';


export default defineConfig({
	root: join(process.cwd(), 'index'),

	plugins: [
		((): Plugin => {
			return {
				name: 'index-style-injector',

				transformIndexHtml: async (_, context) => {
					if (!context.filename.endsWith('index/index.html'))
						return;

					return [
						{
							tag:   'link',
							attrs: {
								rel:  'stylesheet',
								href: './index.css',
							},
							injectTo: 'head',
						},
						{
							tag:   'script',
							attrs: {
								type: 'module',
								src:  './index.ts',
							},
							injectTo: 'head',
						},
					];
				},
			};
		})(),
	],
});
