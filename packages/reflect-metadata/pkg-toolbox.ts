import { defineToolbox } from '@roenlie/package-toolbox/toolbox';


export default defineToolbox(async () => {
	const exclude = (path: string) => [ '.demo', '.test', '.bench' ]
		.every(seg => !path.includes(seg));

	return {
		indexBuilder: {
			entrypoints:    [ { path: './src/index.ts', packageExport: false } ],
			defaultFilters: [ exclude ],
		},
		exportsBuilder: {
			entries: [
				{ path: './use', default: './dist/lib/use.js' },
				{ path: '.',   default: './dist/lib/index.js' },
				{ path: './*', default: './dist/lib/*'        },
			],
			options: {
				override: true,
			},
		},
	};
});
