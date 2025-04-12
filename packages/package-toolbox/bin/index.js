#!/usr/bin/env node
// @ts-check
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { toolbox } from '../dist/toolbox/toolbox.js';


/**
* @template T
* @typedef { import('yargs').ArgumentsCamelCase<T> } Args
*/

/**
* @typedef { Args<{
* 	config: string,
* 	outFile?: string,
* }> } MergeTSConfig
*/

/**
* @typedef { Args<{
* 	release: import('semver').ReleaseType
* }> } IncrementVersion
*/

/**
* @typedef { Args<
* 	import('../src/build-package/build-package.ts').BuildPackageOptions
* > } BuildIndexes
*/


const cmds = await toolbox();
const noop = () => { /*  */ };

// eslint-disable-next-line no-undef
let cli = yargs(hideBin(process.argv)).demandCommand(1);

cli = cli.command(
	'merge-tsconfig',
	'Merges tsconfig inheritance chain into a single tsconfig.',
	noop,
	async (args) => {
		const { config, outFile } = /** @type {MergeTSConfig} */ (args);
		if (typeof config !== 'string')
			throw new Error('Missing config argument.');

		cmds.mergeTSConfig(config, outFile ?? config);
	},
).command(
	'increment-version',
	'increment the package.json version.',
	noop,
	args => {
		const { release } = /** @type {IncrementVersion} */ (args);

		cmds.incrementVersion(release);
	},
).command(
	'build-package [name]',
	'Builds and optionally publishes a package.',
	noop,
	async (args) => {
		const { name, verbose, publish, dryRun } = /** @type {BuildIndexes} */ (args);

		if (typeof name !== 'string')
			throw new Error('Missing name argument.');

		cmds.buildPackage({
			name,
			verbose,
			publish,
			dryRun,
		});
	},
);

if (cmds.type === 'full') {
	cli = cli.command(
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
	);
}

cli.parse();
