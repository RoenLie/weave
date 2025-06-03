import { existsSync, readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { dirname } from 'node:path';
import { join } from 'node:path/posix';

import type { ExportObject, PackageJson } from './package-json.ts';


const nameToPathMap: Map<string, string> = new Map();
const nameToContentMap: Map<string, PackageJson> = new Map();
const ensurePackageLookup = async () => {
	if (nameToPathMap.size)
		return;

	const globPath = join(
		process.cwd().replaceAll('\\', '/'),
		'/**/package.json',
	);

	//console.log('Looking for package.json files in', globPath);

	const packageGlob = glob(globPath);
	const packagePaths: string[] = [];
	for await (const path of packageGlob)
		packagePaths.push(path);

	for (const path of packagePaths) {
		const json: PackageJson = JSON.parse(readFileSync(path, 'utf-8'));
		if (!json.name) {
			console.warn('Missing name in package json\n', path);
			continue;
		}

		nameToPathMap.set(json.name, path);
		nameToContentMap.set(json.name, json);
	}
};

export const getPackageDir = async (packageName: string): Promise<string | undefined> => {
	await ensurePackageLookup();

	const packagePath = nameToPathMap.get(packageName);
	if (!packagePath)
		return;

	return dirname(packagePath);
};


export const getPackageDeps = (json: PackageJson): [string, string][] => {
	const dependencies = json.dependencies;
	const devDependencies = json.devDependencies;

	const deps = Object.entries({
		...dependencies,
		...devDependencies,
	});

	return deps;
};


export const getWorkspaceDeps = (json: PackageJson): string[] => {
	return getPackageDeps(json)
		.filter(([ , ver ]) => ver.startsWith('workspace:'))
		.map(([ name ]) => name);
};


export const getPackageBuildOrder = async (
	packageName: string,
	ignoreBuiltPackages?: boolean,
): Promise<string[]> => {
	await ensurePackageLookup();

	interface Node {
		name: string;
		deps: Node[];
	};

	const rootPkg = nameToContentMap.get(packageName);
	if (!rootPkg) {
		console.warn('No package with name:', packageName);

		return [];
	}

	const rootNode: Node = { name: rootPkg.name, deps: [] };
	createNodeTree(rootNode);

	const dependencies = traverseUpwards(rootNode);

	const flat = dependencies
		.reduceRight((acc, cur) => (cur.forEach(d => acc.add(d)), acc), new Set<string>());

	if (ignoreBuiltPackages) {
		// Filter out packages that are already built
		for (const name of flat) {
			if (name === packageName)
				continue;

			const pkg = nameToContentMap.get(name);
			if (!pkg)
				continue;

			const extractExportPaths = (exp: ExportObject) => {
				const paths: string[] = [];
				for (const value of Object.values(exp)) {
					if (typeof value === 'string')
						paths.push(value);
					else if (typeof value === 'object' && value !== null)
						paths.push(...extractExportPaths(value));
				}

				return paths;
			};

			const pkgPath = await getPackageDir(name);
			if (!pkgPath) {
				console.warn('No package path found for', name);
				continue;
			}

			let pkgHasBeenBuilt = false;

			if (pkg.main && existsSync(join(pkgPath, pkg.main))) {
				pkgHasBeenBuilt = true;
			}
			else {
				const paths = Object.values(pkg.exports ?? {})
					.flatMap(exp => typeof exp === 'string' ? exp : extractExportPaths(exp));

				const anyPathExists = paths
					.some(path => path ? existsSync(join(pkgPath, path)) : false);

				if (anyPathExists)
					pkgHasBeenBuilt = true;
			}

			if (pkgHasBeenBuilt)
				flat.delete(name);
		}
	}

	return [ ...flat ];

	function createNodeTree(node: Node) {
		const visitedNodes: WeakSet<Node> = new WeakSet();
		const nodeQueue: Node[] = [ node ];
		while (nodeQueue.length) {
			const node = nodeQueue.shift()!;
			if (visitedNodes.has(node) && visitedNodes.add(node))
				continue;

			const pkg = nameToContentMap.get(node.name);
			if (!pkg)
				continue;

			for (const dep of getWorkspaceDeps(pkg)) {
				const newNode: Node = {
					name: dep,
					deps: [],
				};

				node.deps.push(newNode);
				nodeQueue.push(newNode);
			}
		}
	}

	function traverseUpwards(
		node: Node,
		dependencies: string[][] = [],
		visitedNodes: WeakSet<Node> = new WeakSet(),
		depth = 0,
	) {
		if (visitedNodes.has(node) && visitedNodes.add(node))
			return dependencies;

		if (node.deps.length) {
			for (const child of node.deps)
				traverseUpwards(child, dependencies, visitedNodes, depth + 1);
		}

		const arr = dependencies[depth] ?? (dependencies[depth] = []);
		arr.push(node.name);

		return dependencies;
	}
};
