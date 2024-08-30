import { execPromise } from './utilities/exec-promise.js';
import { getPackageBuildOrder } from './utilities/find-build-order.js';

const args = process.argv.slice(2);
const packageName = args[0] ?? '';
const buildOrder = await getPackageBuildOrder(packageName);

console.log('Building packages...', buildOrder);
for (const cmd of buildOrder)
	await execPromise(`pnpm --filter=${ cmd } run build`);
