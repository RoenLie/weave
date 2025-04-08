import { execPromise } from './utilities/exec-promise.ts';
import { getPackageBuildOrder, getPackageDir } from './utilities/find-build-order.ts';


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
console.log('Building packages...', '\n' + buildOrder.join('\n→ ') + '\n');


const handleStdout = (data: any) => verbose && process.stdout.write(data);


let count = 0;
for (const cmd of buildOrder) {
	let interval: ReturnType<typeof setInterval> | undefined = undefined;
	if (process.stdout.isTTY && !verbose) {
		interval = setInterval(() => {
			process.stdout.clearLine(0);
			process.stdout.cursorTo(0);
			process.stdout.write(`Building ${ cmd }` + '.'.repeat(count));
			count = (count + 1) % 4;
		}, 500);
	}
	else {
		console.log(`Building ${ cmd }...`);
	}

	const [ _, err ] = await execPromise(`pnpm --filter=${ cmd } run build`, handleStdout);
	clearInterval(interval);

	if (err)
		throw err;
}

if (publish || dryRun) {
	console.log('Merging tsconfig.json files...');
	let [ _, err ] = await execPromise(
		`cd ${ packageDir } && pkg-toolbox merge-tsconfig --config ./src/tsconfig.json`,
		handleStdout,
	);

	if (err)
		throw err;

	[ _, err ] = await execPromise(`cd ${ packageDir } && pnpm merge-tsconfig`, handleStdout);

	console.log('Incrementing package version...');
	[ _, err ] = await execPromise(`cd ${ packageDir } && pkg-toolbox increment-version`, handleStdout);
	if (err)
		throw err;

	if (!dryRun) {
		console.log('Publishing package...');
		[ _, err ] = await execPromise(`cd ${ packageDir } && pnpm publish --access public --no-git-checks`, handleStdout);
		if (err)
			throw err;
	}
}
