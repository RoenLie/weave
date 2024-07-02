import { parse } from 'path';

import { toPascalCase } from '../../../shared/to-pascal-case.js';
import { toTagName } from './to-tag-name.js';


export const createModuleIdFromPath = (path: string, prefix = 'alias:') => {
	const fileInfo = parse(path);

	return prefix + fileInfo.name
		.replaceAll('.', '-')
		.replaceAll(' ', '-') + '.ts';
};


export const createComponentTagFromPath = (path: string) => {
	const fileInfo = parse(path);
	const tagname = toTagName(fileInfo.name, 'midoc');

	const folders = path.split('/')
		.reduce((p, c) => {
			c.startsWith('_') && p.push(c.replace('_', ''));

			return p;
		}, [] as string[]);

	folders.push(tagname);

	return folders.join('-')
		.replaceAll(' ', '-')
		.replaceAll(/\d/g, '')
		.toLowerCase();
};


export const createComponentNameFromPath = (path: string) => {
	const fileInfo = parse(path);

	return toPascalCase('Midoc' + fileInfo.name.replaceAll(' ', '-') + 'Cmp');
};
