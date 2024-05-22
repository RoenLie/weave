import type { CopyOptions } from '../filesystem/copy-files.js';
import type { createPackageExports  } from '../package-exports/package-exports.js';


export interface ToolboxConfig {
	incrementPackage?: {
		registry: 'npmjs'
	};
	indexBuilder?: {
		entrypoints: {
			path: string;
			filters?: ((path: string) => boolean)[];
			packagePath?: string;
			packageExport?: boolean;
			includeWildcard?: boolean;
		}[];
		defaultFilters?: ((path: string) => boolean)[];
		exclusionJSDocTag?: string;
		defaultPackageExport?: boolean;
		packageExportNameTransform?: (path: string) => string;
	};
	exportsBuilder?: {
		entries: Parameters<typeof createPackageExports>['0'],
		options?: Parameters<typeof createPackageExports>['1']
	},
	copy?: Record<string, CopyOptions>;
}


export const defineToolbox = async (
	config: () => (ToolboxConfig | Promise<ToolboxConfig>),
) => config;
