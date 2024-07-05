import envPaths, { type Paths } from 'env-paths';
import { mkdir } from 'fs/promises';
import { join } from 'node:path';


interface SynapsePaths extends Paths {
	/**
	 * Directory for file uploads
	 *
	 * Combination of Data + uploads folder.
	 */
	uploads: string;

	/**
	 * Directory to put uploads before they are picked up by ocr and vectorization.
	 */
	tempUploads: string;

	/**
	 * Directory for sqlite databases.
	 */
	databases: string;
}


export const appName = 'Synapse';
export const paths = envPaths(appName) as SynapsePaths;
paths.uploads = join(paths.data, 'uploads');
paths.databases = join(paths.data, 'databases');

// Make sure the application paths exist.
await Promise.all(Object.values(paths)
	.map(path => mkdir(path, { recursive: true })));
