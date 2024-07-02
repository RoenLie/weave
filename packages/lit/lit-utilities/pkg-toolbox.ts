import { createEntrypointsFromDirectories } from '@roenlie/package-toolbox/filesystem/create-index-entries.js';
import { defineToolbox } from '@roenlie/package-toolbox/toolbox';


export default defineToolbox(async () => {
	const exclude = (path: string) => [ '.demo', '.test', '.bench' ]
		.every(seg => !path.includes(seg));

	const entrypoints = createEntrypointsFromDirectories([ '/src' ]).map(entry => {
		entry.packageExport = false;
		entry.packagePath = '';

		return entry;
	});

	return {
		indexBuilder: {
			entrypoints: [
				{
					path: './src/index.ts',
					packageExport: true,
					packagePath: '.'
				},
				...entrypoints
			],
			defaultFilters:             [ exclude ],
			defaultPackageExport:       false,
			packageExportNameTransform: path => path
				.replace('/src', '/dist')
				.replace('.ts', '.js'),
		},
	};
});
