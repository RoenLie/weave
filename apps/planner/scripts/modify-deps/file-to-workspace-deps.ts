import { readFileSync, writeFileSync } from 'fs';

import { getPackagePaths } from './get-project-package-paths.js';


const { packages } = await getPackagePaths();


const fileToWorkspaceDeps = () => {
	// go through all package.json files, if they have file: deps, change them to workspace:*
	packages.forEach(p => {
		const content = readFileSync(p, { encoding: 'utf8' });
		const parsed: {
			name?: string;
			dependencies?: Record<string, string>;
			devDependencies?: Record<string, string>;
		} = JSON.parse(content);

		if (!parsed.name)
			return;

		const deps = parsed?.dependencies ?? {};
		for (const dep in deps) {
			const value = deps[dep]!;
			if (value.startsWith('file:'))
				deps[dep] = 'workspace:*';
		}

		const devDeps = parsed?.devDependencies ?? {};
		for (const dep in devDeps) {
			const value = devDeps[dep]!;
			if (value.startsWith('file:'))
				devDeps[dep] = 'workspace:*';
		}

		writeFileSync(p, JSON.stringify(parsed, null, '\t'));
	});
};

fileToWorkspaceDeps();
