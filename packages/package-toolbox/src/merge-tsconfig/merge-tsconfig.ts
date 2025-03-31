import { writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

import {
	getTSConfigFromModule, getTSConfigFromPath,
	mergeJson, type TSConfig,
} from './merge-tsconfig-utils.js';


export const mergeTSConfig = (config: string, outFile: string): void => {
	const localDir = process.cwd();

	const entrypointPath = join(resolve(localDir, dirname(config)), basename(config));

	const tsConfig = getTSConfigFromPath(entrypointPath);
	if (!tsConfig)
		return console.error('Could not get initial tsconfig. ' + entrypointPath);

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

	const outPath = join(resolve(localDir, dirname(outFile), basename(outFile)));

	writeFileSync(outPath, JSON.stringify(merged, undefined, 3));
};
