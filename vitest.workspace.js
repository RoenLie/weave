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
			name:        'bootstrap-clone',
			include:     [ 'packages/bootstrap-clone/**/*.{spec,test,bench}.ts' ],
			environment: 'happy-dom',
			setupFiles:  [],
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
