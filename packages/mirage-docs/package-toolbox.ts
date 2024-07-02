import { defineToolbox } from '@roenlie/package-toolbox/toolbox';


export default defineToolbox(() => {
	const exclude = (path: string) => [ '-demo', '.demo', '.test', '.bench' ]
		.every(seg => !path.includes(seg));

	return {
		indexBuilder: {
			entrypoints:    [ { path: './src/app/index.ts' } ],
			defaultFilters: [ exclude ],
		},
	};
});
