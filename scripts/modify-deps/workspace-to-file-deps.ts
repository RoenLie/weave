import { readFileSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';

import { getPackageInfo } from './get-project-package-paths.ts';


const { packages, projectPathCache } = await getPackageInfo();


const workspaceToFileDeps = () => {
	// Get go through each file, if it has a workspace: dependency, find the path to that package.
	// save the path to that package in a cache, and replace the dependency with a file:...path dependency.
	packages.forEach(p => {
		const content = readFileSync(p, { encoding: 'utf8' });
		const parsed: {
			name?:            string;
			dependencies?:    Record<string, string>;
			devDependencies?: Record<string, string>;
		} = JSON.parse(content);

		if (!parsed.name)
			return;

		const currentPkgPath = projectPathCache.get(parsed.name)!;

		const resolveWorkspacePaths = (deps: Record<string, string>) => {
			for (const dep in deps) {
				const value = deps[dep];
				if (value && value.startsWith('workspace:')) {
					// get the dependency project path.
					const pkgPath = projectPathCache.get(dep);
					if (!pkgPath)
						throw (`Could not find path for dep: ${ dep }`);

					// find the path to this package.
					const relativePath = relative(currentPkgPath, pkgPath).replaceAll('\\', '/');

					// assign the relative path as the new dependency.
					deps[dep] = 'file:' + relativePath;
				}
			}
		};

		const deps = parsed?.dependencies ?? {};
		resolveWorkspacePaths(deps);

		const devDeps = parsed?.devDependencies ?? {};
		resolveWorkspacePaths(devDeps);

		writeFileSync(p, JSON.stringify(parsed, null, '\t'));
	});
};

workspaceToFileDeps();
