import type { RequestHandler } from 'express';
import { globby } from 'globby';

import { app } from '../app/main.js';


// Caches the starting dir -> dir-paths and file-paths.
const cache = new Map<string, [string[], string[]]>();


interface Exports {
	get?:    RequestHandler | RequestHandler[];
	put?:    RequestHandler | RequestHandler[];
	post?:   RequestHandler | RequestHandler[];
	patch?:  RequestHandler | RequestHandler[];
	delete?: RequestHandler | RequestHandler[];
}


const register = (
	method: keyof Exports,
	route: string,
	handlers?: RequestHandler | RequestHandler[],
) => {
	if (!handlers)
		return;
	if (Array.isArray(handlers))
		app[method](route, ...handlers);
	else
		app.get(route, handlers);
};


const sortValue = (str: string) => {
	let val = 0;

	// We want the dynamic route with the most params last.
	if (/\[.*?\]/.test(str)) {
		const partCount = str
			.replace(/^\[|\]$/g, '')
			.split(',').length;

		val += partCount;
	}

	// Index should be slightly prioritized
	if (/.+index\.\w+$/.test(str))
		val -= 1;

	return val;
};


// Exclude any path that contains a part starting with _
const pathFilter = (path: string) => !path.split('/')
	.some(part => part.startsWith('_'));


export const registerFileRoutes = async (dir: string, prefix = '') => {
	if (prefix && !prefix.startsWith('/'))
		prefix = '/' + prefix;

	let [ dirPaths, filePaths ] = cache.get(dir) ?? [];
	if (!dirPaths || !filePaths) {
		[ dirPaths, filePaths ] = (await Promise.all([
			globby(dir, { onlyDirectories: true }),
			globby(dir, { onlyFiles: true }),
		])).map(arr => arr.filter(pathFilter)) as [string[], string[]];
	}

	// Filter out asset files, sort according to dynamic
	// and index names, await import for future use.
	const imports = await Promise.all(
		filePaths.filter(
			path => !path.includes('assets'),
		).sort(
			(a, b) => sortValue(a) - sortValue(b),
		).map(async path => ({
			path,
			exports: await import(path) as Exports,
		})),
	);

	for (const { path, exports } of imports) {
		let route = prefix + '/' + path
			.replace(dir, '')
			.replace(/^\/+/, '')
			.replace(/\.[^/.]+$/, '');

		if (/\/index(\.\w+)?$/.test(route))
			route = route.replace(/\/index(\.\w+)?$/, '');

		if (/\[.*?\]/.test(route)) {
			route = route.replaceAll(/\[.*?\]/g, (str) => {
				str = str
					.replace(/^\[|\]$/g, '')
					.split(',')
					.map(part => ':' + part.trim())
					.join('/');

				return str;
			});
		}

		register('get',    route, exports.get);
		register('put',    route, exports.put);
		register('post',   route, exports.post);
		register('patch',  route, exports.patch);
		register('delete', route, exports.delete);
	}
};
