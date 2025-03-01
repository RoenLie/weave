import { defineWorkspace } from 'vitest/config';


export default defineWorkspace([
	{
		test: {
			name:       'sanguine',
			include:    [ 'packages/sanguine/**/*.{spec,test,bench}.ts' ],
			setupFiles: [],
		},
	},
	{
		test: {
			name:       'poe2-passive-editor',
			include:    [ 'apps/poe2-passive-editor/**/*.{spec,test,bench}.ts' ],
			setupFiles: [],
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
