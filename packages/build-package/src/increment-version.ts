import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path/posix';
import { inc, type ReleaseType } from 'semver';

import type { PackageJson } from './package-json.ts';


export const incrementVersion = (
	packageDir: string,
	options?: {
		release?: ReleaseType;
	},
): void => {
	const { release = 'patch' } = options ?? {};

	const packagePath = join(packageDir, 'package.json');
	const packageJsonInput = readFileSync(packagePath, { encoding: 'utf-8' });

	const parsedPackage: PackageJson = JSON.parse(packageJsonInput);
	const packageName = parsedPackage.name;
	const packageVersion = parsedPackage.version;

	let currentVersion = '1.0.0';
	let nextVersion = currentVersion;
	try {
		currentVersion = execSync(`npm view ${ packageName }@latest version`).toString();
		nextVersion = inc(currentVersion, release) || currentVersion;
		if (!nextVersion)
			throw new Error(`Failed to increment version from ${ currentVersion }`);
	}
	catch { /*  */ }

	const packageJsonOutput = packageJsonInput.replace(packageVersion, nextVersion);

	writeFileSync(packagePath, packageJsonOutput);

	console.log('Increment Version');
	console.log('Changed version from:', packageVersion, '→', nextVersion);
};
