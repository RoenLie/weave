import { defineToolbox } from '@roenlie/package-toolbox/toolbox';


export default defineToolbox(async () => {
	const exclude = [
		'.demo',
		'.test',
		'.bench',
	];

	return {
		indexBuilder: {
			entrypoints: [
				{
					path:    './src/index.ts',
					filters: [ (path) => exclude.every(seg => !path.includes(seg)) ],
				},
			],
		},
	};
});
