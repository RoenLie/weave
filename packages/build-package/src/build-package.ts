import { execPromise } from './exec-promise.ts';
import { getPackageBuildOrder, getPackageDir } from './find-build-order.ts';


export interface BuildPackageOptions {
	name:     string;
	force?:   boolean;
	verbose?: boolean;
}


export const buildPackage = async (options: BuildPackageOptions): Promise<void> => {
	const { name: packageName, verbose } = options;

	if (!packageName)
		throw new Error('Package name is required as the first argument.');

	const packageDir = await getPackageDir(packageName);
	if (!packageDir)
		throw new Error('Package not found');

	const buildOrder = await getPackageBuildOrder(packageName, !options.force);
	console.log('Building packages...', '\n→ ' + buildOrder.join('\n→ ') + '\n');

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
};
