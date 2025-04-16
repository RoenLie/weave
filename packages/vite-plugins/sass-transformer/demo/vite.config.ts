import { defineConfig } from 'vite';

import { transformSass } from '../src/index.ts';

export default defineConfig({
	root: './demo',

	plugins: [
		transformSass({
			rootDir:    './styles',
			debugLevel: 'error',
		}),
	],
});
