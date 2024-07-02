import { genToArray, getFiles } from './file-lookup.js';

export const getPackagePaths = async (startPath = '.') =>
	(await genToArray(getFiles(startPath, /package\.json/))).filter(p => !p.includes('node_modules'));
