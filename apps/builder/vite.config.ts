import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';


export default defineConfig(() => {
	const builderRoot        = join(process.cwd(), 'builder');
	const builderAssets = join(process.cwd(), 'builder', 'assets');

	return {
		root:      builderRoot,
		publicDir: builderAssets,
		plugins:   [
			((): Plugin => {
				return {
					name: 'builder',
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
