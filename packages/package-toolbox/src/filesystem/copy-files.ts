import path from 'node:path';
import util from 'node:util';

import { bold, green, yellow } from 'colorette';
import fs, { type CopyOptions as FSCopyOptions, type WriteFileOptions } from 'fs-extra';
import { globby, type Options } from 'globby';

import { areDatesEqual } from '../utils/compare-dates.js';
import { isObject } from '../utils/is-object.js';


export interface Target extends Options {
	/** Path or glob of what to copy. */
	readonly from: string | string[];

	/** One or more destinations where to copy. */
	readonly to: string | string[];

	/** Change destination file or folder name. */
	readonly rename?: string | ((name: string, extension: string, fullPath: string) => string);

	/** Modify file contents. */
	readonly transform?: (contents: Buffer, name: string) => any;
}


export interface CopyOptions extends Options, Exclude<WriteFileOptions, BufferEncoding | null>, FSCopyOptions {
	/**
	 * Remove the base directory structure of copied files.
	 * @default true
	 */
	readonly flatten?: boolean;

	/**
	 * Array of targets to copy.
	 * @default []
	 */
	readonly targets?: readonly Target[];

	/**
	 * Output copied items to console.
	 * @default false
	 */
	readonly verbose?: boolean;
}


const stringify = (value: any) => util.inspect(value, { breakLength: Infinity });


const isFile = async (filePath: string) =>  (await fs.stat(filePath)).isFile();


const renameTarget = (target: string, rename: NonNullable<Target['rename']>, src: string) => {
	const parsedPath = path.parse(target);

	return typeof rename === 'string'
		? rename
		: rename(parsedPath.name, parsedPath.ext.replace('.', ''), src);
};


const generateCopyTarget = async (
	from: string,
	to: string,
	{ flatten, rename, transform }: {
		flatten: CopyOptions['flatten'];
		rename: Target['rename'];
		transform: Target['transform'];
	},
) => {
	if (transform && !await isFile(from))
		throw new Error(`"transform" option works only on files: '${ from }' must be a file`);

	const { base, dir } = path.parse(from);
	const destinationFolder = (flatten || (!flatten && !dir))
		? to
		: dir.replace(dir.split('/')[0] ?? '', to);

	const destination = path.join(destinationFolder, rename ? renameTarget(base, rename, from) : base);
	const contents = transform ? await transform(await fs.readFile(from), base) : undefined;

	return {
		from,
		to: destination,
		contents,
		rename,
		transform,
	};
};


export const copy = async (options: CopyOptions = {}) => {
	const {
		flatten = true,
		targets = [],
		verbose = false,
		...restPluginOptions
	} = options;

	type CopyTarget = Awaited<ReturnType<typeof generateCopyTarget>>;
	const copyTargets: CopyTarget[] = [];

	for (const target of targets) {
		if (!isObject(target))
			throw new Error(`${ stringify(target) } target must be an object`);

		const { to, rename, from, transform, ...restTargetOptions } = target;

		if (!from || !to)
			throw new Error(`${ stringify(target) } target must have "src" and "dest" properties`);

		if (rename && typeof rename !== 'string' && typeof rename !== 'function')
			throw new Error(`${ stringify(target) } target's "rename" property must be a string or a function`);

		const matchedPaths = await globby(from, {
			expandDirectories: false,
			onlyFiles:         false,
			...restPluginOptions,
			...restTargetOptions,
		});

		for (const matchedPath of matchedPaths) {
			const destPromises = Array.isArray(to)
				? to.map(dest => generateCopyTarget(matchedPath, dest, { flatten, rename, transform }))
				: [ generateCopyTarget(matchedPath, to, { flatten, rename, transform }) ];

			copyTargets.push(...await Promise.all(destPromises));
		}
	}

	if (copyTargets.length) {
		if (verbose)
			console.log(green('copied:'));

		for (const copyTarget of copyTargets) {
			const { contents, to, from, transform } = copyTarget;

			if (transform) {
				await fs.outputFile(to, contents, restPluginOptions);
			}
			else {
				try {
					const [ newStat, existStat ] = await Promise.all([ await fs.stat(from), await fs.stat(to) ]);
					if (areDatesEqual(newStat.mtime, existStat.mtime))
						continue;
				}
				catch (error) { /*  */ }

				await fs.copy(from, to, restPluginOptions);
			}

			if (verbose) {
				let message = green(`  ${ bold(from) } → ${ bold(to) }`);
				const flags = Object.entries(copyTarget)
					.filter(([ key, value ]) => [ 'renamed', 'transformed' ].includes(key) && value)
					.map(([ key ]) => key.charAt(0).toUpperCase());

				if (flags.length)
					message = `${ message } ${ yellow(`[${ flags.join(', ') }]`) }`;

				console.log(message);
			}
		}
	}

	if (!copyTargets.length && verbose)
		console.log(yellow('no items to copy'));
};
