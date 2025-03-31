import { defineToolbox } from '@roenlie/package-toolbox/toolbox';


export default defineToolbox(async () => {
	const exclude = (path: string) => [ '.demo', '.test', '.bench' ]
		.every(seg => !path.includes(seg));

	return {
		indexBuilder: {
			entrypoints: [
				{
					path:            './src/filesystem/index.ts',
					packagePath:     './filesystem',
					includeWildcard: true,
				},
			],
			defaultFilters:             [ exclude ],
			defaultPackageExport:       true,
			packageExportNameTransform: (path) => path
				.replace('./src', './dist')
				.replace('.ts', '.js'),
		},
		incrementPackage: {
			registry: 'npmjs',
		},
	};
});
