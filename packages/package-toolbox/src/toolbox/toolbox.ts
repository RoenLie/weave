import { existsSync } from 'node:fs';

import type { ReleaseType } from 'semver';

import { buildPackage, type BuildPackageOptions } from '../build-package/build-package.js';
import { copy } from '../filesystem/copy-files.js';
import { indexBuilder as buildIndex } from '../index-builder/index-builder.js';
import { mergeTSConfig } from '../merge-tsconfig/merge-tsconfig.js';
import { createPackageExports, createTypePath, type ExportEntry } from '../package-exports/package-exports.js';
import { incrementVersion } from '../versioning/increment-version.js';
import { loadConfig } from './config.js';


export interface PartialToolbox {
	type:             'partial';
	mergeTSConfig:    (config: string, outFile: string) => void;
	incrementVersion: (release?: ReleaseType) => void;
	buildPackage:     (options: BuildPackageOptions) => Promise<void>;
}

export interface Toolbox {
	type:             'full';
	mergeTSConfig:    (config: string, outFile: string) => void;
	incrementVersion: (release?: ReleaseType) => void;
	buildPackage:     (options: BuildPackageOptions) => Promise<void>;
	indexBuilder:     () => Promise<void>;
	exportsBuilder:   () => Promise<void>;
	copy:             (profile: string) => Promise<void>;
}


export const toolbox = async (filePath = './pkg-toolbox.ts'): Promise<PartialToolbox | Toolbox> => {
	const partialToolbox = {
		type:          'partial',
		mergeTSConfig: (config: string, outFile: string) => {
			mergeTSConfig(config, outFile);
		},
		incrementVersion: (release: ReleaseType | undefined) => {
			incrementVersion({ release });
		},
		buildPackage: async (options) => {
			await buildPackage(options);
		},
	} satisfies PartialToolbox;

	if (!existsSync(filePath)) {
		console.warn('No pkg-toolbox.ts file found. Only certain actions available.');

		return partialToolbox;
	}

	const config = await loadConfig(filePath);

	return {
		...partialToolbox,
		type:         'full',
		indexBuilder: async () => {
			if (!config.indexBuilder)
				throw ('No index builder config supplied.');

			const {
				entrypoints,
				exclusionJSDocTag,
				defaultFilters = [],
				defaultPackageExport = false,
				packageExportNameTransform = (path) =>
					path.replace('./src', './dist').replace('.ts', '.js'),
			} = config.indexBuilder;

			const wildExportTransform = (path: string) =>
				packageExportNameTransform(path).replace(/index\..+$/, '*');

			const packageExports: ExportEntry[] = [];

			await Promise.all(entrypoints.map((entrypoint) => {
				const { path, filters, packageExport, packagePath, includeWildcard } = entrypoint;

				if (packagePath) {
					if (includeWildcard) {
						packageExports.push({
							path:    packagePath + '/*',
							default: wildExportTransform(path),
						});
					}

					const defPath = packageExportNameTransform(path);
					const exprt = {
						path:    packagePath,
						type:    createTypePath(defPath),
						default: defPath,
					} as ExportEntry;

					if (packageExport)
						packageExports.push(exprt);
					else if (defaultPackageExport)
						packageExports.push(exprt);
				}

				return buildIndex(
					path,
					[ ...defaultFilters, ...filters ?? [] ],
					{ exclusionJSDocTag },
				);
			}));

			await createPackageExports(packageExports);
		},
		exportsBuilder: async () => {
			if (!config.exportsBuilder)
				throw ('No exports builder config supplied.');

			await createPackageExports(
				config.exportsBuilder.entries,
				config.exportsBuilder.options,
			);
		},
		copy: async (profile) => {
			const cfg = config?.copy?.[profile];
			if (cfg)
				await copy(cfg);
		},
	} satisfies Toolbox;
};
