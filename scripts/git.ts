import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { execPromise } from './utilities/exec-promise.ts';
import { getPackagePaths } from './utilities/get-package-paths.ts';


const entries: {
	hash:    string;
	author:  string;
	date:    string;
	message: string;
	paths:   string[];
}[] = [];

await execPromise('git log --raw -1', (data: string) => {
	data.split('\ncommit')
		.filter(c => c)
		.forEach(commit => {
			const [ hash, author, date, , message, , paths ] = commit.split('\n');
			entries.push({
				hash:    hash!.replace('commit', '').trim(),
				author:  author!.replace('Author:', '').trim(),
				date:    date!.replace('Date:', '').trim(),
				message: message!.trim(),
				paths:   paths!.split('\n').map(path => path.split('\t')[1]!),
			});
		});
});


const packagePathsChanged = entries.reduce((prev, cur) => {
	cur.paths.forEach(path =>
		path.startsWith('packages/') && prev.push(path));

	return prev;
}, [] as string[]);


interface Package {
	name: string;
	path: string;
	deps: Map<string, string>;
}

const getPackageFromPath = (path: string) => {
	const content = JSON.parse(readFileSync(resolve(path), { encoding: 'utf8' }));

	return {
		name: content.name as string,
		path,
		deps: new Map<string, string>(Object.entries({
			...content.dependencies,
			...content.peerDependencies,
			...content.devDependencies,
		})),
	} as Package;
};


const getWorkspaceDependants = async (packagePath: string) => {
	const packagePaths = await getPackagePaths('./packages');

	const initialPackage = getPackageFromPath(packagePath);
	const packages = packagePaths.map(path => getPackageFromPath(path));

	const dependants = new Set<Package>();
	const getDependants = (pkg: Package) => {
		dependants.add(pkg);

		const dependsOn = packages
			.filter(p => p.deps.has(pkg.name))
			.filter(p => !dependants.has(p));

		dependsOn.forEach(dep => {
			dependants.add(dep);
			getDependants(dep);
		});
	};

	getDependants(initialPackage);

	return dependants;
};


let packagesToIncrement: Package[] = [];
for (const path of packagePathsChanged)
	packagesToIncrement.push(...(await getWorkspaceDependants(resolve(path))));

const map = new Map<string, Package>();
packagesToIncrement.forEach(pkg => map.set(pkg.name, pkg));
packagesToIncrement = [ ...map ].map(([ , pkg ]) => pkg);

console.log(packagesToIncrement);
