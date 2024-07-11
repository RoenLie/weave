import { createEntrypointsFromDirectories } from '@roenlie/package-toolbox/filesystem';
import { defineToolbox } from '@roenlie/package-toolbox/toolbox';


export default defineToolbox(async () => {
	const exclude = (path: string) => [ '-demo', '.demo', '.test', '.bench' ]
		.every(seg => !path.includes(seg));

	const entrypoints = createEntrypointsFromDirectories([ '/src/components' ])
		.map(entry => {
			entry.packageExport = false;

			return entry;
		});

	return {
		indexBuilder: {
			entrypoints: [
				{ path: './src/index.ts' },
				{ path: './src/styles/index.ts' },
				{ path: './src/utilities/index.ts' },
				...entrypoints,
			],
			defaultFilters: [ exclude ],
		},
	};
});
