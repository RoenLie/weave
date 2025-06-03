import { writeFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { join as joinPosix } from 'node:path/posix';

import {
	getTSConfigFromModule, getTSConfigFromPath,
	mergeJson, type TSConfig,
} from './merge-tsconfig-utils.ts';


export const mergeTSConfig = (tsconfigPath: string): void => {
	const tsConfig = getTSConfigFromPath(tsconfigPath);
	if (!tsConfig)
		return console.error('Could not get initial tsconfig. ' + tsconfigPath);

	const tsConfigChain: TSConfig[] = [ tsConfig ];

	let currentTsConfig: TSConfig | undefined = tsConfig;
	while (currentTsConfig?.extends) {
		currentTsConfig = getTSConfigFromModule(currentTsConfig.extends);
		if (!currentTsConfig)
			break;

		tsConfigChain.unshift(currentTsConfig);
	}

	const merged = mergeJson(...tsConfigChain);
	delete merged.extends;

	writeFileSync(tsconfigPath, JSON.stringify(merged, undefined, 3));
};


export const mergeTSConfigInPackage = async (packageDir: string): Promise<void> => {
	const tsConfigGlob = glob(joinPosix(packageDir, '/**/tsconfig.json'));
	for await (const tsConfigPath of tsConfigGlob)
		mergeTSConfig(tsConfigPath);
};
