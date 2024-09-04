import { execPromise } from './utilities/exec-promise.js';
import { getPackageBuildOrder, getPackageDir } from './utilities/find-build-order.js';


const args = process.argv.slice(2);

// First argument not starting with -- is the package name
const packageName = args.find(arg => !arg.startsWith('--'));
const publish = args.includes('--publish');
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');

if (!packageName)
	throw new Error('Package name is required as the first argument.');


const packageDir = await getPackageDir(packageName);
if (!packageDir)
	throw new Error('Package not found');


const buildOrder = await getPackageBuildOrder(packageName);
console.log('Building packages...', '\n' + buildOrder.join('\n→ '));


const handleStdout = (data: any) => {
	if (verbose)
		process.stdout.write(data);
};


for (const cmd of buildOrder)
	await execPromise(`pnpm --filter=${ cmd } run build`, handleStdout);


if (publish || dryRun) {
	console.log('Merging tsconfig.json files...');
	await execPromise(`cd ${ packageDir } && pkg-toolbox merge-tsconfig --config ./src/tsconfig.json`, handleStdout);

	console.log('Incrementing package version...');
	await execPromise(`cd ${ packageDir } && pkg-toolbox increment-version`, handleStdout);

	if (!dryRun) {
		console.log('Publishing package...');
		await execPromise(`cd ${ packageDir } && pnpm publish --access public --no-git-checks`, handleStdout);
	}
}
