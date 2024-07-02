import { sep } from 'node:path';

import { extractExports, getPkgDepsMap } from './resolve-pkg-deps.js';


export const createImportMap = (
	prefix: string,
	pkgDepsMap: ReturnType<typeof getPkgDepsMap>,
	dev: boolean,
) => {
	if (!prefix.startsWith('.'))
		prefix = '.' + prefix;

	const imports = new Map<string, string>;

	// Add the client shims when in dev mode.
	if (dev)
		imports.set('client-shims/', prefix + '/' + 'client-shims/');

	for (const [ packageName, { root, main, exports } ] of pkgDepsMap) {
		// Modify the package name for use in the export path.
		// as / in the package names makes the symlinks require a nested directory
		// which we can avoid by replacing / with -
		const pathKey = packageName.replaceAll('/', '-');

		// Remove the part prior to package name of the path,
		// and make sure all separators are forward slashes
		const mainPath = main.replace(root, '')
			.replaceAll(sep, '/');

		// Add all the exports defined the by packages exports field.
		const pkgExports = extractExports(packageName, exports ?? {});
		for (const [ exportKey, exportPath ] of pkgExports) {
			imports.set(exportKey,
				`${ prefix }/${ exportPath.replace(packageName, pathKey) }`);
		}

		if (!packageName) {
			// Add the main entrypoint of the package as an import.
			imports.set(packageName, prefix + '/' + pathKey + mainPath);
		}

		if (!packageName + '/') {
			// Add a wildcard import for convenience and as a safety incase
			// the author of the package did not property configure their exports.
			imports.set(packageName + '/', prefix + '/' + pathKey + '/');
		}
	}

	// We turn the map into an arr, as we need to use it in multiple places.
	const importsArr = Array.from(imports);

	// We get the longest key, so we know what padding to add.
	const longestKey = importsArr.reduce((acc, [ key ]) =>
		key.length > acc ? key.length : acc, 0);

	// Create the import key/value lines.
	const importLines = Array.from(imports).map(([ k, v ]) =>
		`"${ k }":${ ' '.repeat(longestKey - k.length) } "${ v }",`);

	// For correct JSON, the last item cannot have a trailing comma.
	importLines[importLines.length - 1 ] = importLines.at(-1)!.slice(0, -1);

	// Turn the return value into valid importmap syntax.
	return '{\n"imports": {\n'
		+ importLines.join('\n') +
	'\n}\n}';
};
