import { execPromise } from './exec-promise.ts';
import { incrementVersion } from './increment-version.ts';
import { mergeTSConfigInPackage } from './merge-tsconfig.ts';


export const publishPackage = async (packageDir: string, verbose: boolean, dryRun: boolean): Promise<void> => {
	try {
		console.log('Merging tsconfig.json files...');
		await mergeTSConfigInPackage(packageDir);
	}
	catch (err) {
		return console.error('Error merging tsconfig.json files:', err);
	}
	try {
		console.log('Incrementing package version...');
		incrementVersion(packageDir, { release: 'patch' });
	}
	catch (err) {
		return console.error('Error incrementing package version:', err);
	}

	if (!dryRun) {
		console.log('Publishing package...');
		const handleStdout = (data: any) => verbose && process.stdout.write(data);
		const [ _, err ] = await execPromise(`cd ${ packageDir } && pnpm publish --access public --no-git-checks`, handleStdout);
		if (err)
			throw err;
	}
};
