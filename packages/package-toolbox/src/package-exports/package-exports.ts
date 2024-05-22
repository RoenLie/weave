import { readFileSync, writeFileSync } from 'node:fs';


export interface ExportEntry {
	path: string;
	types?: string;
	default: string;
	import?: string;
	node?: string;
	require?: string;
	custom?: Omit<ExportEntry, 'custom'>[]
}


export const createPackageExports = async (
	entries: ExportEntry[],
	options?: {
		override?: boolean
	},
) => {
	const packageJson = readFileSync('./package.json', { encoding: 'utf8' });
	const parsedPackage = JSON.parse(packageJson);

	const exports: Record<string, Partial<ExportEntry> | string> = options?.override
		? {}
		: (parsedPackage['exports'] ?? {});

	for (const entry of entries) {
		if (entry.path.endsWith('/*')) {
			exports[entry.path] = entry.default;
			continue;
		}

		if (!entry.types)
			entry.types = createTypePath(entry.import ?? entry.default);

		interface Entry {
			types?: string;
			import?: string;
			node?: string;
			require?: string;
			default?: string;
		}

		type EntryRec = {[key: string]: string | EntryRec} & Entry;

		const target = (exports[entry.path] ??= {}) as EntryRec;
		target.types = entry.types;

		entry.custom?.forEach(val => {
			const tar = (target[val.path] ??= {}) as EntryRec;
			val.types   && (tar.types   = val.types);
			val.import  && (tar.import  = val.import);
			val.node    && (tar.node    = val.node);
			val.require && (tar.require = val.require);
			val.default && (tar.default = val.default);
		});

		entry.import  && (target.import  = entry.import);
		entry.node    && (target.node    = entry.node);
		entry.require && (target.require = entry.require);
		entry.default && (target.default = entry.default);

		const sortEntry = (entry: EntryRec) => {
			const keyvalues: {key: string; value: string | EntryRec;}[] = [];

			for (const key in entry) {
				keyvalues.push({ key, value: entry[key]! });
				delete entry[key];
			}

			const assignValue = (kv: {key: string}) =>
				kv.key === 'types' ? 0
					: kv.key === 'import'  ? 20
						: kv.key === 'node' ? 30
							: kv.key === 'require' ? 40
								: kv.key === 'default' ? 50
									: 10;

			keyvalues.sort((a, b) => assignValue(a) - assignValue(b));
			keyvalues.forEach(({ key, value }) => entry[key] = value);
		};

		sortEntry(target);

		for (const key in target) {
			const value = target[key];
			if (typeof value === 'object')
				sortEntry(value);
		}
	}

	parsedPackage['exports'] = exports;
	const stringified = JSON.stringify(parsedPackage, null, '\t');

	writeFileSync('./package.json', stringified);
};


export const createTypePath = (path: string) => {
	const split = path.split('/');
	const filesplit = split.at(-1)!.split('.');
	filesplit[filesplit.length - 1] = 'd.ts';
	split[split.length - 1] = filesplit.join('.');

	return split.join('/');
};
