import { access } from 'fs/promises';
import { dirname } from 'path';


export const exists = async (path: string) => {
	let exists = false;

	await access(path)
		.then(() => exists = true)
		.catch(() => exists = false);

	return exists;
};
