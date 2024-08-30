import { execPromise } from './utilities/exec-promise.js';
import { getPackageBuildOrder } from './utilities/find-build-order.js';

const args = process.argv.slice(2);
const packageName = args[0] ?? '';
const publish = args.includes('--publish');
const buildOrder = await getPackageBuildOrder(packageName);

console.log('Building packages...', buildOrder);
for (const cmd of buildOrder)
	await execPromise(`pnpm --filter=${ cmd } run build`);

console.log('Merging tsconfig.json files...');
execPromise(`pnpm --filter=${ packageName } pkg-toolbox merge-tsconfig --config ./src/tsconfig.json`);

console.log('Incrementing package version...');
execPromise(`pnpm --filter=${ packageName } pkg-toolbox increment-version`);

if (publish)
	console.log('Publishing package...');
	//execPromise(`pnpm --filter=${ packageName } publish --access public --no-git-checks`);
