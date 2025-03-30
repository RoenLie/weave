import { defineWorkspace } from 'vitest/config';


export default defineWorkspace([
	{
		test: {
			name:       'poe2-passive-editor',
			include:    [ 'apps/poe2-passive-editor/**/*.{spec,test,bench}.ts' ],
			setupFiles: [],
		},
	},
	{
		test: {
			name:       'bootstrap_clone',
			setupFiles: [],
			include:    [ 'packages/bootstrap-clone/**/*.{spec,test,bench}.ts' ],
			browser:    {
				enabled:            true,
				headless:           true,
				provider:           'playwright',
				screenshotFailures: false,
				instances:          [ { browser: 'chromium' } ],
			},
		},
	},
	//{
	//	test: {
	//		name:       'all',
	//		include:    [ 'packages/**/*.{spec,test}.ts' ],
	//		setupFiles: [],
	//	},
	//},
]);
