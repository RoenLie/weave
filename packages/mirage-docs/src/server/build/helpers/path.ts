import { sep } from 'node:path';


export const normalizePath = (path: string) => {
	return path
		.replaceAll('/', sep)
		.replaceAll('\\', sep)
		.replaceAll(new RegExp(sep + '{2,}', 'g'), sep);
};


export const browserifyPath = (path: string) => {
	return path
		.replaceAll('\\', '/')
		.replaceAll(/\/{2,}/g, '/');
};
