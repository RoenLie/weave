import { execPromise } from './utilities/exec-promise.js';
import { getPackageBuildOrder } from './utilities/find-build-order.js';


const packageName = process.argv.slice(2)[0] ?? '';

const buildOrder = await getPackageBuildOrder(packageName);
console.log({ buildOrder });


for (const cmd of buildOrder)
	await execPromise(`pnpm --filter=${ cmd } run build`);
