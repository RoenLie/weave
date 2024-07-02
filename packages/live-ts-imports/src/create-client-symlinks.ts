import { existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getPkgDepsMap } from './resolve-pkg-deps.js';


export const createClientSymlinks = (
	vendorDir: string,
	pkgDepsMap: ReturnType<typeof getPkgDepsMap>,
	dev: boolean,
) => {
	// Make sure the folder to put symlinks in exists.
	mkdirSync(vendorDir, { recursive: true });

	// symlink package deps spesified by consumer.
	pkgDepsMap.forEach(({ root }, key) => {
		const dir = join(vendorDir, key.replaceAll('/', '-'));
		if (!existsSync(dir))
			symlinkSync(root, dir, 'dir');
	});

	if (dev) {
		// Symlink in the client-shims
		const currentFile = fileURLToPath(import.meta.url);
		const currentDir = dirname(currentFile);
		const shimDirFrom = join(currentDir, '../src/client-shims');
		const shimDirTo = join(vendorDir, 'client-shims');

		if (!existsSync(shimDirTo))
			symlinkSync(shimDirFrom, shimDirTo);
	}
};
