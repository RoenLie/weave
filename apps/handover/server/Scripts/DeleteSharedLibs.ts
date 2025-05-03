#!/usr/bin/env node

import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { csvToJson } from './read-csv.ts';


const configIndex = process.argv.indexOf('--config');
if (configIndex === -1)
	throw new Error('No config file specified. Use --config <path> to specify the config file.');


const configPath = process.argv[configIndex + 1];


type stringliteral = (string & Record<never, never>);
interface BuildVars extends Record<string, string> {
	OutputPath:        string;
	TargetFramework:   'net9.0' | stringliteral;
	Configuration:     'Debug' | 'Release' | stringliteral;
	ProjectDirectory:  string;
	SolutionDirectory: string;
	ProjectName:       string;
}

const buildVars = await csvToJson<BuildVars>(configPath);
if (!buildVars)
	throw new Error('Failed to load build variables from the config file. ' + configPath);

const outputPath = buildVars.OutputPath;

console.log('Cleaning up' + outputPath + '...');

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
