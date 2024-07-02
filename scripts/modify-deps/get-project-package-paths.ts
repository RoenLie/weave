import { readFileSync } from 'fs';

import { getPackagePaths } from '../utilities/get-package-paths.js';


export const getPackageInfo = async () => {
	// Get all workspace package.json files
	const packages = await getPackagePaths();

	const paths = packages.map(p => {
		const content = readFileSync(p, { encoding: 'utf8' });
		const name = JSON.parse(content).name;
		const path = p.replace('/package.json', '').replace('\\package.json', '');

		return [ name, path ] as [name: string, path: string];
	}).filter(([ name ]) => !!name);

	const projectPathCache = new Map<string, string>(paths);

	return {
		packages,
		projectPathCache,
	};
};
