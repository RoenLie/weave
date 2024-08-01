import { defineToolbox } from '@roenlie/package-toolbox/toolbox';


export default defineToolbox(async () => {
	return {
		indexBuilder: {
			entrypoints: [
				{
					path:    './src/lib/index.ts',
					filters: [
						path => [
							'-demo',
							'.demo',
							'/docs',
						].every(seg => !path.includes(seg)),
					],
					packageExport: true,
					packagePath:   '.',
				},
				{
					path:          './src/setup/index.ts',
					filters:       [ () => true ],
					packageExport: true,
					packagePath:   './setup',
				},
			],
			packageExportNameTransform: (name: string) => {
				return name
					.replace('./src', './dist')
					.replace('.ts', '.js');
			},
		},
	};
});
