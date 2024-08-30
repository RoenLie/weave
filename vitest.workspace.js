import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
	'./packages/mirage-docs/tests/vite.config.ts',
	'./packages/mirage-docs/vite.config.ts',
	'./packages/mirage-docs/vite-workers.config.ts',
]);
