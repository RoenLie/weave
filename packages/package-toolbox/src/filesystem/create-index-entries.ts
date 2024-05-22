import { readdirSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';


export interface Entrypoint {
	path: string;
	packagePath: string;
	packageExport: boolean;
	filters: ((path: string) => boolean)[];
}


export const createEntrypointsFromDirectories = (
	directories: string[],
	entryFilters: ((path: string) => boolean)[] = [],
	exclude: ((path: string) => boolean)[] = [],
) => {
	const entrypoints: Entrypoint[] = [];

	const create = (
		dirpath: string,
	) => {
		const folderPath = join(resolve(), dirpath);
		const dirs = readdirSync(folderPath);

		dirs.forEach(dir => {
			const initialPath = join(folderPath, dir);
			if (!statSync(initialPath).isDirectory())
				return;

			const path = '.' + initialPath
				.replace(resolve(), '')
				.replaceAll(sep, '/') + '/' + 'index.ts';

			if (exclude.some(fn => fn(path)))
				return;

			const packagePath = './' + path.slice(1)
				.replace(dirpath, '')
				.split('/')
				.filter(Boolean)
				.at(0);

			entrypoints.push({
				path,
				packagePath,
				filters:       entryFilters,
				packageExport: true,
			});
		});
	};

	directories.forEach(create);

	return entrypoints;
};
