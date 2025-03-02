import { defineConfig, type Plugin } from 'vite';
import bodyparser from 'body-parser';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path/posix';
import type { StorableGraphNode } from './src/app/graph/graph-node.ts';
import type { StorableGraphConnection } from './src/app/graph/graph-connection.ts';


export default defineConfig({
	esbuild: {
		supported: {
			'top-level-await': true,
		},
	},
	worker: {
		format: 'es',
	},
	plugins: [
		(() => {
			const sourceDir = join('src', 'assets', 'graphs');
			const dirPath = join(resolve(), sourceDir);

			return {
				name: 'save-graph-api',
				configureServer(server) {
					server.middlewares.use(bodyparser.json({ limit: '20mb', type: 'application/json' }));
					server.middlewares.use(async (req, res, next) => {
						if (req.url !== '/save-graph-to-file')
							return void next();
						if (req.method !== 'POST')
							return void res.end('Invalid method');
						if (!('body' in req))
							return void res.end('Invalid body');

						const body = req.body as {
							version:     number;
							nodes:       StorableGraphNode[];
							connections: StorableGraphConnection[];
						};

						const filePath = join(dirPath, `graph-version-${ body.version }.json`);

						await mkdir(dirPath, { recursive: true });
						await writeFile(filePath, JSON.stringify(body, null, 2));

						return void res.end('Saved');
					});
				},
				// We prevent the page from reloading when a graph is saved.
				handleHotUpdate(ctx) {
					if (ctx.file.includes(sourceDir))
						return [];
				},
			} satisfies Plugin as Plugin;
		})(),
	],
});
