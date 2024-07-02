import { execPromise } from './utilities/exec-promise.js';
import { packageBuildOrder } from './utilities/find-build-order.js';


const buildOrder = await packageBuildOrder();


for await (const cmds of buildOrder)
	await Promise.all(cmds.map(cmd => execPromise(`pnpm --filter=${ cmd } run build`)));
