import { copy } from '../filesystem/copy-files.js';
import { indexBuilder as buildIndex } from '../index-builder/index-builder.js';
import { createPackageExports, createTypePath, type ExportEntry } from '../package-exports/package-exports.js';
import { loadConfig } from './config.js';


export interface Toolbox {
	indexBuilder:   () => Promise<void>;
	exportsBuilder: () => Promise<void>;
	copy:           (profile: string) => Promise<void>;
}


export const toolbox = async (filePath = './pkg-toolbox.ts'): Promise<Toolbox> => {
	const config = await loadConfig(filePath);

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
		copy: async (profile) => {
			const cfg = config?.copy?.[profile];
			if (cfg)
				await copy(cfg);
		},
	} satisfies Toolbox;
};
