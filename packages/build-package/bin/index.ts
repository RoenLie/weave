#!/usr/bin/env node

import { buildPackage } from '../src/build-package.ts';
import { getPackageDir } from '../src/find-build-order.ts';
import { publishPackage } from '../src/publish-package.ts';

console.log('build-package CLI tool');

const args = process.argv.slice(2);

// First argument not starting with -- is the package name
const packageName = args.find(arg => !arg.startsWith('--'));
const force = args.includes('--force');
const verbose = args.includes('--verbose');
const publish = args.includes('--publish');
const dryRun = args.includes('--dry-run');

if (!packageName)
	throw new Error('Package name is required as the first argument.');

await buildPackage({
	name: packageName,
	force,
	verbose,
});

if (publish) {
	const packageDir = await getPackageDir(packageName);
	if (!packageDir)
		throw new Error(`Package ${ packageName } not found.`);

	publishPackage(packageDir, verbose, dryRun);
}
