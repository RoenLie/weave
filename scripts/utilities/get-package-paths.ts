import { genToArray, getFiles } from './file-lookup.ts';


export const getPackagePaths = async (startPath = '.'): Promise<string[]> =>
	(await genToArray(getFiles(startPath, /package\.json/))).filter(p => !p.includes('node_modules'));
