import envPaths, { type Paths } from 'env-paths';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path/posix';


interface AugmentedPaths extends Paths {
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


export const appName = 'DbCode';
export const paths = envPaths(appName) as AugmentedPaths;

// Posix works for windows, and other libs like globby rely on posix paths.
// Therefor we try to always use posix.
for (const key of Object.keys(paths))
	(paths as any)[key] = (paths as any)[key].replaceAll('\\', '/');

paths.uploads     = join(paths.data, 'uploads');
paths.tempUploads = join(paths.temp, 'tempUploads');
paths.databases   = join(paths.data, 'databases');

// Make sure the application paths exist.
Object.values(paths).map(path => mkdir(path, { recursive: true }));
