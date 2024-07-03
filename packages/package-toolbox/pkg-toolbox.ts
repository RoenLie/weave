import { defineToolbox } from '@roenlie/package-toolbox/toolbox';


export default defineToolbox(async () => {
	const exclude = (path: string) => [ '.demo', '.test', '.bench' ]
		.every(seg => !path.includes(seg));

	return {
		indexBuilder: {
			entrypoints: [
				{
					path:        './src/vite-utils/index.ts',
					packagePath: './vite-utils',
				},
				{
					path:        './src/filesystem/index.ts',
					packagePath: './filesystem',
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
