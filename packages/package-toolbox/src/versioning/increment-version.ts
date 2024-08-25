import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

import { inc, type ReleaseType } from 'semver';


export const incrementVersion = (options?: {
	release?: ReleaseType
}) => {
	const { release = 'patch' } = options ?? {};

	const packageJsonInput = readFileSync('./package.json', { encoding: 'utf-8' });

	const parsedPackage = JSON.parse(packageJsonInput);
	const packageName = parsedPackage['name'];
	const packageVersion = parsedPackage['version'];

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

	writeFileSync('./package.json', packageJsonOutput);

	console.log('Package-Toolbox: Increment Version');
	console.log('Changed version from:', packageVersion, '→', nextVersion);
};
