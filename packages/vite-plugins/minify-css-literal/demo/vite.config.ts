import { defineConfig } from 'vite';
import { minifyCssLiteral } from '../src/index.ts';

export default defineConfig({
	root: './demo',

	plugins: [ minifyCssLiteral() ],
});
