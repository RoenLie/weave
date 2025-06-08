import { defineWorkspace } from 'vitest/config';


export default defineWorkspace([
	{
		extends: './apps/poe2builder/vite.config.ts',
		test:    {
			name:       'poe2-passive-editor',
			include:    [ 'apps/poe2-passive-editor/**/*.{spec,test,bench}.ts' ],
			setupFiles: [],
		},
	},
	{
		extends: './packages/core/vite.config.ts',
		test:    {
			name:       'core',
			include:    [ 'packages/core/**/*.{spec,test,bench}.ts' ],
			setupFiles: [],
		},
	},
	{
		extends: './packages/lit-jsx/vite.config.ts',
		test:    {
			name:       'lit-jsx',
			include:    [ 'packages/lit-jsx/**/*.{spec,test,bench}.ts' ],
			setupFiles: [],
		},
	},
	{
		extends: './packages/injector/vite.config.ts',
		test:    {
			name:       'injector',
			include:    [ 'packages/injector/**/*.{spec,test,bench}.ts' ],
			setupFiles: [],
		},
	},
	//{
	//	extends: './packages/bootstrap-clone/vite.config.ts',
	//	test:    {
	//		name:       'bootstrap_clone',
	//		setupFiles: [],
	//		include:    [ 'packages/bootstrap-clone/**/*.{spec,test,bench}.ts' ],
	//		browser:    {
	//			enabled:            true,
	//			headless:           true,
	//			provider:           'playwright',
	//			screenshotFailures: false,
	//			instances:          [ { browser: 'chromium' } ],
	//		},
	//	},
	//},
	//{
	//	test: {
	//		name:       'all',
	//		include:    [ 'packages/**/*.{spec,test}.ts' ],
	//		setupFiles: [],
	//	},
	//},
]);
