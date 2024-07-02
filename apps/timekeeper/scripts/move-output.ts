import { genToArray } from '@eyeshare/shared';
import { getFiles } from '@eyeshare/shared-nodejs';
import { promises } from 'fs';
import path, { resolve } from 'path';

const targetDir = resolve(resolve(), '../../../pocketbase_custom/pb_public/dimension/timekeeper');

const createPath = (path: string) => (targetDir + path.replace(/\\/g, '/')
	.replace(resolve().replace(/\\/g, '/') + '/dist', '')).replace(/\//g, '\\');


const files = (await genToArray(getFiles(resolve() + '/dist'))).map(from => ({
	from,
	to: createPath(from),
}));


if (files.length) {
	// Clear out dir
	await promises.rm(targetDir, { recursive: true, force: true });
	await promises.mkdir(targetDir);

	// Find unique to-dirs, and ensure they exist.
	const uniqueDirs = new Set<string>();
	files.forEach(({ to }) => uniqueDirs.add(path.dirname(to)));

	await Promise.all(Array.from(uniqueDirs).map(d => promises.mkdir(d, { recursive: true })));

	// Copy the files in parallel.
	await Promise.all(files.map(({ from, to }) => promises.copyFile(from, to)));

	console.log(`Copied ${ files.length } assets from to the server project`);
}
else {
	console.log(`No assets were found.`);
}
