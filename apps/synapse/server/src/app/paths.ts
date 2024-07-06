import envPaths, { type Paths } from 'env-paths';
import { mkdir } from 'fs/promises';
import { join } from 'node:path/posix';


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

// Posix works for windows, and other libs like globby rely on posix paths.
// Therefor we try to always use posix.
for (const key of Object.keys(paths))
	(paths as any)[key] = (paths as any)[key].replaceAll('\\', '/');

paths.uploads = join(paths.data, 'uploads');
paths.tempUploads = join(paths.temp, 'tempUploads');
paths.databases = join(paths.data, 'databases');

// Make sure the application paths exist.
await Promise.all(Object.values(paths)
	.map(path => mkdir(path, { recursive: true })));
