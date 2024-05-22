import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

import { inc, type ReleaseType } from 'semver';


export const incrementVersion = (options?: {
	placeholder?: string;
	release?: ReleaseType
}) => {
	const {
		placeholder = '1.0.semver-replace',
		release = 'patch',
	} = options ?? {};

	const packageJsonInput = readFileSync('./package.json', { encoding: 'utf-8' });

	const parsedPackage = JSON.parse(packageJsonInput);
	const packageName = parsedPackage['name'];

	let currentVersion = '0.0.0';
	try {
		currentVersion = execSync(`npm view ${ packageName }@latest version`).toString();
	}
	catch { /*  */ }

	const nextVersion = inc(currentVersion, release);
	if (!nextVersion)
		throw new Error(`Failed to increment version from ${ currentVersion }`);

	const packageJsonOutput = packageJsonInput.replace(placeholder, nextVersion);

	writeFileSync('./package.json', packageJsonOutput);
};
