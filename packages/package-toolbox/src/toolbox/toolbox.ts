import { existsSync } from 'fs';
import type { ReleaseType } from 'semver';

import { copy } from '../filesystem/copy-files.js';
import { indexBuilder as buildIndex } from '../index-builder/index-builder.js';
import { mergeTSConfig } from '../merge-tsconfig/merge-tsconfig.js';
import { createPackageExports, createTypePath, type ExportEntry } from '../package-exports/package-exports.js';
import { incrementVersion } from '../versioning/increment-version.js';
import { loadConfigWithTsup } from './config.js';


export const toolbox = async (filePath = './pkg-toolbox.ts') => {
	if (!existsSync(filePath)) {
		console.warn('No pkg-toolbox.ts file found. Only certain actions available.');

		return {
			incrementVersion: (
				placeholder: string | undefined,
				release: ReleaseType | undefined,
			) => {
				incrementVersion({ placeholder, release });
			},
		};
	}

	const config = await loadConfigWithTsup(filePath);

	return {
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

		copy: async (profile: string) => {
			const cfg = config?.copy?.[profile];
			cfg && await copy(cfg);
		},

		mergeTSConfig: (config: string, outFile: string) => {
			mergeTSConfig(config, outFile);
		},

		incrementVersion: (
			placeholder: string | undefined,
			release: ReleaseType | undefined,
		) => {
			incrementVersion({ placeholder, release });
		},
	};
};
