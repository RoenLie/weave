import { createEntrypointsFromDirectories } from '@roenlie/package-toolbox/filesystem';
import { defineToolbox } from '@roenlie/package-toolbox/toolbox';


export default defineToolbox(async () => {
	const exclude = (path: string) => [ '.demo', '.test', '.bench' ]
		.every(seg => !path.includes(seg));

	const entrypoints = createEntrypointsFromDirectories(
		[ '/src' ],
	);

	return {
		indexBuilder: {
			entrypoints:                entrypoints,
			defaultFilters:             [ exclude ],
			defaultPackageExport:       true,
			packageExportNameTransform: path => path
				.replace('./src', './dist/lib')
				.replace('.ts', '.js'),
		},
	};
});
