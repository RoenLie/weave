#!/usr/bin/env node

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';


const configIndex = process.argv.indexOf('--build-props-path');
if (configIndex === -1)
	throw new Error('Missing --build-props-path argument.');


const configPath = process.argv[configIndex + 1];


interface BuildVars extends Record<string, string> {
	OutputPath: string;
}

const buildVars: BuildVars | undefined = JSON.parse(readFileSync(configPath, 'utf-8'));
if (!buildVars)
	throw new Error('Failed to load build variables from the config file. ' + configPath);

const outputPath = buildVars.OutputPath;

console.log('Removing shared .dlls from ' + outputPath + '...');

const filesToDelete = [
	'Core.dll',
	'Core.pdb',
	'Core.deps.json',
].map(file => join(outputPath, file));

for (const file of filesToDelete) {
	if (!existsSync(file))
		continue;

	try {
		rmSync(file);
		console.log('Deleting ' + file);
	}
	catch (e) {
		console.error('Error deleting ' + file + ':', e);
	}
}
