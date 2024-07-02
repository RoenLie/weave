import { readdirSync, readFileSync  } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';


export type ConditionalExportValue = string | {
	browser?: string | {
		import?: ConditionalExportValue;
		default?: ConditionalExportValue;
	};
	module?: string | {
		import?: ConditionalExportValue;
		default?: ConditionalExportValue;
	},
	import?: ConditionalExportValue;
	default?: ConditionalExportValue;
}


export interface PkgJson {
	type?: 'module' | 'commonjs';
	main?: string;
	exports?: {
		'.'?: ConditionalExportValue
	} & Record<string, ConditionalExportValue>;
	dependencies?: Record<string, string>;
}


export const getPkgDepsMap = (importMeta: ImportMeta, packageNames: string[]) => {
	const callingFile = fileURLToPath(importMeta.url);

	const require = createRequire(callingFile);
	const tryResolve = (...args: Parameters<typeof require.resolve>) => {
		try {
			return require.resolve(...args);
		}
		catch (error) {
			//console.error(error);
		}
	};

	const depMap = new Map<string, {
		root: string;
		main: string;
		exports: PkgJson['exports'];
	}>();

	const getDeps = (name: string) => {
		if (depMap.has(name))
			return;

		const mainImportPath = tryResolve(name);
		if (!mainImportPath)
			return;

		const pkgPath = getClosestPkgJson(mainImportPath);
		const pkgRoot = dirname(pkgPath);
		const pkgFile = readFileSync(pkgPath, 'utf-8');
		const pkgJson = JSON.parse(pkgFile || '{}') as PkgJson;
		const pkgDeps = getPkgDeps(pkgJson);

		let main = '';

		if (pkgJson.type === 'module') {
			const rootExport = pkgJson.exports?.['.'];
			if (rootExport)
				main = getRawExportPath(rootExport);
		}

		main ||= pkgJson.main ?? '';

		if (main)
			main = join(pkgRoot, main);

		main ??= mainImportPath;

		depMap.set(name, {
			root:    pkgRoot,
			main:    main,
			exports: pkgJson.exports,
		});

		pkgDeps.forEach(getDeps);
	};

	packageNames.forEach(getDeps);

	return depMap;
};


export const getClosestPkgJson = (initialPath: string) => {
	let count = 0;
	let pkgPath = '';
	let dir = dirname(initialPath);

	while (!pkgPath && count < 100) {
		const files = readdirSync(dir);
		pkgPath = files.some(f => f.endsWith('package.json'))
			? join(dir, 'package.json') : '';

		if (!pkgPath)
			dir = dir.split(sep).slice(0, -1).join(sep);

		count++;
	}

	return pkgPath;
};


export const getPkgDeps = (pkgJson: PkgJson) => {
	const deps = pkgJson.dependencies ?? {};

	return Object.keys(deps);
};


export const extractExports = (
	packageName: string,
	exports: Record<string, ConditionalExportValue>,
) => {
	const map = new Map<string, string>();

	const startingDotExp = /^./;
	const trailingStarExp = /(?<=\/)\*$/;

	for (const [ name, value ] of Object.entries(exports ?? {})) {
		const rawExportPath = getRawExportPath(value)
			.replace(startingDotExp, '')
			.replace(trailingStarExp, '');

		if (!rawExportPath)
			continue;

		const exportKey = packageName + name
			.replace(startingDotExp, '')
			.replace(trailingStarExp, '');

		const exportPath = (packageName + '/' + rawExportPath)
			.replaceAll(/\/{2,}/g, '/');

		if (!map.has(exportKey))
			map.set(exportKey, exportPath);
	}

	return map;
};

export const getRawExportPath = (expValue: ConditionalExportValue): string => {
	let value: string | ConditionalExportValue | undefined;

	if (typeof expValue === 'string') {
		value = expValue;
	}
	else if (typeof expValue.browser === 'string') {
		value = expValue.browser;
	}
	else if (typeof expValue.module === 'string') {
		value = expValue.module;
	}
	else {
		value = expValue.browser?.import
			|| expValue.browser?.default
			|| expValue.module?.import
			|| expValue.module?.default
			|| expValue.import
			|| expValue.default
			|| '';
	}

	if (typeof value !== 'string')
		return getRawExportPath(value);

	return value;
};
