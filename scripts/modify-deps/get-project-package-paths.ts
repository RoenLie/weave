import { readFileSync } from 'node:fs';

import { getPackagePaths } from '../utilities/get-package-paths.ts';


export const getPackageInfo = async (): Promise<{
	packages:         string[];
	projectPathCache: Map<string, string>;
}> => {
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
