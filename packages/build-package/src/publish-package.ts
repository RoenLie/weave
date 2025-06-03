import { execPromise } from './exec-promise.ts';
import { incrementVersion } from './increment-version.ts';


export const publishPackage = async (packageDir: string, verbose: boolean, dryRun: boolean): Promise<void> => {
	const handleStdout = (data: any) => verbose && process.stdout.write(data);
	let [ _, err ]: Awaited<ReturnType<typeof execPromise>> = [ undefined, undefined ] as any;

	console.log('Merging tsconfig.json files...');
	[ _, err ] = await execPromise(`cd ${ packageDir } && pnpm merge-tsconfig`, handleStdout);

	console.log('Incrementing package version...');
	try {
		incrementVersion(packageDir, { release: 'patch' });
	}
	catch (err) {
		return void (verbose && console.error(err));
	}

	if (!dryRun) {
		//console.log('Publishing package...');
		//[ _, err ] = await execPromise(`cd ${ packageDir } && pnpm publish --access public --no-git-checks`, handleStdout);
		//if (err)
		//	throw err;
	}
};
