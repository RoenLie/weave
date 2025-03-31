import { access } from 'node:fs/promises';


export const exists = async (path: string): Promise<boolean> => {
	let exists = false;

	await access(path)
		.then(() => exists = true)
		.catch(() => exists = false);

	return exists;
};
