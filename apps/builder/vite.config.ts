import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';


export default defineConfig(() => {
	const root        = join(process.cwd(), 'builder');
	const indexStyles = readFileSync('./builder/index.css', 'utf-8');

	return {
		root,
		plugins: [
			((): Plugin => {
				return {
					name: 'builder',
					transformIndexHtml(_, context) {
						if (context.path !== '/index.html')
							return;

						return [
							{
								tag:      'style',
								children: indexStyles,
								injectTo: 'head-prepend',
							},
						];
					},
					configureServer(server) {
						server.hot.on('save', (data, client) => {
							console.log(data);
						});
					},
				};
			})(),
		],
	};
});
