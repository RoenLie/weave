import { readFile } from 'node:fs/promises';
import { SQLite } from '../app/database.ts';
import pacote from 'pacote';
import { maybe } from '@roenlie/core/async';


export const test = () => {};


export const insertPackageFromPaths = async (paths: string[]) => {
	using db = new SQLite();

	const transaction = db.transaction(async () => {
		db.exec(/* sql */`
		CREATE TABLE IF NOT EXISTS packages (
			id INTEGER PRIMARY KEY,
			path TEXT DEFAULT '' NOT NULL,
			content TEXT DEFAULT '' NOT NULL
		);
		`);

		db.exec(/* sql */`
		DELETE FROM packages
		`);

		const insert = db.prepare(/* sql */`
		INSERT INTO packages (path, content)
		VALUES (?, ?)
		`);

		const packagePath = paths.find(path => path.endsWith('package.json'));
		if (!packagePath)
			return console.error('No package json found, cannot continue.');

		const packageJson = await readFile(packagePath, 'utf-8');
		const packageObj = JSON.parse(packageJson) as {
			name:    string;
			version: string;
		};
		const packageName = packageObj.name;
		const packageVersion = packageObj.version;

		for await (let path of paths) {
			// Get the content of the file prior to mutating the path.
			const content = await readFile(path, 'utf-8');

			// replace all windows seperators with posixs
			path = path.replaceAll('\\', '/');
			// get path without the part of this systems temp folder.
			path = path.split('package/').at(-1)!;
			// add package name and version infront of the path.
			path = packageName + '/' + packageVersion + '/' + path;

			insert.run(path, content);
		}
	});

	await transaction();
};


export const insertPackageContents = (
	name: string,
	version: string,
	contents: {
		path:    string;
		content: string;
	}[],
) => {
	using db = new SQLite();

	const transaction = db.transaction(() => {
		db.exec(/* sql */`
		CREATE TABLE IF NOT EXISTS packages (
			id      INTEGER PRIMARY KEY,
			name    TEXT DEFAULT '' NOT NULL,
			version TEXT DEFAULT '' NOT NULL,
			path    TEXT DEFAULT '' NOT NULL,
			content TEXT DEFAULT '' NOT NULL
		);
		`);

		db.prepare(/* sql */`
		DELETE FROM packages
		WHERE 1 = 1
			AND name = (?)
			AND version = (?)
		`).run(name, version);

		const insert = db.prepare(/* sql */`
		INSERT INTO packages (name, version, path, content)
		VALUES (?, ?, ?, ?)
		`);

		for (const file of contents)
			insert.run(name, version, file.path, file.content);
	});

	transaction();
};

export const createPackageTree = (name: string, version: string) => {


};


interface PkgNode {
	name:    string;
	version: string;
	deps:    PkgNode[];
};


export const createPkgNodeTree = async (name: string, version: string) => {
	const rootNode: PkgNode = { name, version, deps: [] };

	const visitedNodes = new WeakSet<PkgNode>();
	const nodeQueue: PkgNode[] = [ rootNode ];
	while (nodeQueue.length) {
		const node = nodeQueue.shift()!;
		if (visitedNodes.has(node) && visitedNodes.add(node))
			continue;

		const [ pkg, err ] = await maybe(
			pacote.manifest(`${ node.name }@${ node.version }`),
		);

		if (err)
			continue;

		// update the node with the resolved version.
		node.version = pkg.version;

		for (const [ name, version ] of Object.entries(pkg.dependencies ?? {})) {
			const newNode: PkgNode = { name, version, deps: [] };

			node.deps.push(newNode);
			nodeQueue.push(newNode);
		}
	}

	return rootNode;
};


export const createPkgDepBuckets = (
	node: PkgNode,
	dependencies: string[][] = [],
	visitedNodes = new WeakSet<PkgNode>(),
	depth = 0,
) => {
	if (visitedNodes.has(node) && visitedNodes.add(node))
		return dependencies;

	if (node.deps.length) {
		for (const child of node.deps)
			createPkgDepBuckets(child, dependencies, visitedNodes, depth + 1);
	}

	const arr = dependencies[depth] ?? (dependencies[depth] = []);
	arr.push(node.name + '@' + node.version);

	return dependencies;
};
