import Fs from 'node:fs';
import path from 'node:path';


async function genToArray<T>(generated: AsyncIterable<T>): Promise<T[]> {
	const out: T[] = [];
	for await (const x of generated)
		out.push(x);

	return out;
}


async function* getFiles(directory: string, pattern?: RegExp): AsyncGenerator<string, void, string | undefined> {
	const dirents = await Fs.promises.readdir(directory, { withFileTypes: true });
	for (const dirent of dirents) {
		const res = path.resolve(directory, dirent.name);
		if (dirent.isDirectory())
			yield* getFiles(res, pattern);
		else if (pattern?.test(res) ?? true)
			yield res;
	}
}


const _getImportPaths = (filepath: string) => {
	const fileContent = Fs.readFileSync(filepath, { encoding: 'utf8' });
	const paths = new Set<string>();

	const wildImports = fileContent.matchAll(/import ['"](.+?)['"]/gs);
	const normalImports = fileContent.matchAll(/import (?!['"]).+? from ['"](.+?)['"];/gs);
	const dynamicImports = fileContent.matchAll(/import\(['"](.+?)['"]\)/gs);

	[ ...wildImports, ...normalImports, ...dynamicImports ].forEach(ent => {
		const [ , capture ] = [ ...ent ];
		if (capture)
			paths.add(capture);
	});

	return [ ...paths ];
};


export const getImportPaths = async (
	from: string,
	options?: {
		exclude?: Partial<{
			file?: Partial<{
				startsWith: string[];
				includes: string[];
				endsWith: string[];
			}>
			path: Partial<{
				startsWith: string[];
				includes: string[];
				endsWith: string[];
			}>;
		}>
	},
) => {
	const pathSet = new Set<string>();
	let files = (await genToArray(getFiles(from)));

	const { exclude = {} } = options ?? {};

	if (exclude?.file) {
		const { startsWith, includes, endsWith } = exclude.file;

		files = files.filter(file => {
			const notStartsWith = !startsWith?.some(w => file.startsWith(w));
			const notIncludes   = !includes?.some(w => file.includes(w));
			const notEndsWith   = !endsWith?.some(w => file.endsWith(w));

			return notStartsWith && notIncludes && notEndsWith;
		});
	}

	for (const file of files)
		_getImportPaths(file).forEach(path => pathSet.add(path));

	let paths = [ ...pathSet ];

	if (exclude?.path) {
		const { startsWith, includes, endsWith } = exclude.path;

		paths = paths.filter(file => {
			const notStartsWith = !startsWith?.some(w => file.startsWith(w));
			const notIncludes   = !includes?.some(w => file.includes(w));
			const notEndsWith   = !endsWith?.some(w => file.endsWith(w));

			return notStartsWith && notIncludes && notEndsWith;
		});
	}

	return paths;
};


export const getExternalImportPaths = async (...[ from, options ]: Parameters<typeof getImportPaths>) => {
	options ??= {};
	options.exclude ??= {};
	options.exclude.path ??= {};
	options.exclude.path.startsWith ??= [];
	options.exclude.path.startsWith.push('.');

	return getImportPaths(from, options);
};
