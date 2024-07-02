import { readFileSync } from 'node:fs';

import { getPackagePaths } from './get-package-paths.js';


export const getPackageDeps = (json: any) => {
	const dependencies: Record<string, string> = json.dependencies;
	const devDependencies: Record<string, string> = json.devDependencies;

	const deps = Object.entries({
		...dependencies,
		...devDependencies,
	});

	return deps;
};


export const getWorkspaceDeps = (json: any) => {
	return getPackageDeps(json)
		.filter(([ , ver ]) => ver.startsWith('workspace:'))
		.map(([ name ]) => name);
};


export const packageBuildOrder = async (excludePkg: string[] = []) => {
	const packages = await getPackagePaths('./packages');

	const workspaceDeps = packages.map(path => {
		const json = JSON.parse(readFileSync(path, { encoding: 'utf8' }));

		const name: string = json.name;
		const dependencies: Record<string, string> = json.dependencies;
		const devDependencies: Record<string, string> = json.devDependencies;

		const deps = Object.entries({
			...dependencies,
			...devDependencies,
		})
			.filter(([ , version ]) => version.startsWith('workspace:'))
			.filter(([ name ]) => !excludePkg.includes(name))
			.map(([ name ]) => name);

		return {
			name,
			deps,
		};
	});

	workspaceDeps.sort(() => 0.5 - Math.random());
	workspaceDeps.sort((a, b) => {
		if (a.deps.some(d => d === b.name))
			return 1;
		if (b.deps.some(d => d === a.name))
			return -1;

		return a.deps.length - b.deps.length;
	});

	const grouped: {name: string; deps: string[]}[][] = [];

	let insertAt = 0;
	while (workspaceDeps.length) {
		const pkg = workspaceDeps.shift()!;
		const set = new Set(pkg?.deps);

		const addIfValid = () => {
			const currentPkgs = grouped[insertAt] ??= [];
			const pkgLength = Math.max(0, ...currentPkgs.map(pkg => pkg.deps.length));
			const sameAmountOfDeps = pkgLength === pkg.deps.length;
			if (sameAmountOfDeps || currentPkgs.length === 0) {
				const depsAreTheSame = currentPkgs.every(pkg => pkg.deps.every(d => set.has(d)));
				if (depsAreTheSame) {
					grouped[insertAt] ??= [];
					grouped[insertAt]?.push(pkg);

					return true;
				}
			}

			return false;
		};

		while (!addIfValid())
			insertAt += 1;
	}

	return grouped.map(group => group.map(pkg => pkg.name));
};
