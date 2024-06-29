import type { RequestHandler, Express } from 'express';
import { globby } from 'globby';

import { app } from '../app/main.js';
import { basename, join, resolve } from 'path/posix';


// Caches the starting dir -> file-paths.
const cache = new Map<string, string[]>();


export interface ControllerMethod {
	path:     string;
	method:   Extract<keyof Express, 'get' | 'put' | 'post' | 'patch' | 'delete'>;
	handlers: RequestHandler[]
}


export type ExpressController = ControllerMethod[];


export const registerControllers = async (dir: string) => {
	if (dir.startsWith('/'))
		dir = dir.replace(/^\/+/, '');

	// We only register controllers from a directory subtree once.
	const cached = cache.get(dir);
	if (cached)
		return;

	const filePaths = await globby(dir, { onlyFiles: true });

	const promises = filePaths.filter(path => basename(path).endsWith('controller.ts'))
		.map(async path => await import(join(resolve(), path)).then(m => m.default));

	const imports: ExpressController[] = await Promise.all(promises);

	imports.forEach(controller =>
		controller.forEach(({ path, method, handlers }) =>
			app[method](path, handlers)));
};
