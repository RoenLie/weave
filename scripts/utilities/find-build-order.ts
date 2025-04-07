import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { dirname } from 'node:path';
import { join } from 'node:path/posix';

import type { PackageJson } from '../types/package-json.ts';


const nameToPathMap = new Map<string, string>();
const nameToContentMap = new Map<string, PackageJson>();
const ensurePackageLookup = async () => {
	if (nameToPathMap.size)
		return;

	const globPath = join(
		process.cwd().replaceAll('\\', '/').split('/').slice(0, -1).join('/'),
		'/**/package.json',
	);

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

export const getPackageDir = async (packageName: string) => {
	await ensurePackageLookup();

	const packagePath = nameToPathMap.get(packageName);
	if (!packagePath)
		return;

	return dirname(packagePath);
};


export const getPackageDeps = (json: PackageJson) => {
	const dependencies = json.dependencies;
	const devDependencies = json.devDependencies;

	const deps = Object.entries({
		...dependencies,
		...devDependencies,
	});

	return deps;
};


export const getWorkspaceDeps = (json: PackageJson) => {
	return getPackageDeps(json)
		.filter(([ , ver ]) => ver.startsWith('workspace:'))
		.map(([ name ]) => name);
};


export const getPackageBuildOrder = async (packageName: string) => {
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

	const flat = dependencies.reduceRight((acc, cur) => {
		cur.forEach(dep => acc.add(dep));

		return acc;
	}, new Set<string>());


	return [ ...flat ];

	function createNodeTree(node: Node) {
		const visitedNodes = new WeakSet<Node>();
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
		visitedNodes = new WeakSet<Node>(),
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
