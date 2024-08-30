import { execPromise } from './utilities/exec-promise.js';
import { getPackageBuildOrder, getPackageDir } from './utilities/find-build-order.js';


const args = process.argv.slice(2);
const packageName = args[0] ?? '';
const publish = args.includes('--publish');

const packageDir = await getPackageDir(packageName);
if (!packageDir)
	throw new Error('Package not found');


const buildOrder = await getPackageBuildOrder(packageName);
console.log('Building packages...', buildOrder);

for (const cmd of buildOrder)
	await execPromise(`pnpm --filter=${ cmd } run build`);


console.log('Merging tsconfig.json files...');
await execPromise(`cd ${ packageDir } && pkg-toolbox merge-tsconfig --config ./src/tsconfig.json`);


console.log('Incrementing package version...');
await execPromise(`cd ${ packageDir } && pkg-toolbox increment-version`);


if (publish) {
	console.log('Publishing package...');
	await execPromise(`cd ${ packageDir } && pnpm publish --access public --no-git-checks`);
}
