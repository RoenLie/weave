#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { toolbox } from '../dist/toolbox/toolbox.js';


const cmds = await toolbox();
const noop = () => { /*  */ };

yargs(hideBin(process.argv)).demandCommand(
	1,
).command(
	'increment-version',
	'increment the package.json version.',
	noop,
	(args) => {
		const { placeholder, release } = args;
		cmds.incrementVersion(placeholder, release);
	},
).command(
	'build-indexes',
	'build indexes at configured locations.',
	noop,
	async () => {
		cmds.indexBuilder();
	},
).command(
	'build-exports',
	'build package.json exports as defined in config.',
	noop,
	async () => {
		cmds.exportsBuilder();
	},
).command(
	'copy',
	'Copies files base on the profile key supplied.',
	noop,
	async (args) => {
		const { profile } = args;
		if (typeof profile !== 'string')
			throw ('Invalid profile arguments: ' + JSON.stringify(args));

		cmds.copy(profile);
	},
).command(
	'merge-tsconfig',
	'Merges tsconfig inheritance chain into a single tsconfig.',
	noop,
	async (args) => {
		const { config, outFile } = args;
		if (typeof config !== 'string')
			throw new Error('Missing config argument.');

		cmds.mergeTSConfig(config, outFile ?? config);
	},
).parse();
