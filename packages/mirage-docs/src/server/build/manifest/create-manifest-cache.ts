import type { Declarations } from '../../../shared/metadata.types.js';
import { createTagCache } from '../cache/create-tag-cache.js';
import { createManifest } from './create.js';


export const createManifestCache = async (options: {
	directories:         { path: string; whitelist?: RegExp[]; blacklist?: RegExp[]; }[];
	componentTagCache?:  Map<string, string>;
	tagCapturePatterns?: RegExp[];
} | Map<string, string>): Promise<Map<string, Declarations>> => {
	/** Map of tag and path to where that component is declared */
	const tagCache = options instanceof Map ? options : await createTagCache({
		directories:        options.directories,
		componentTagCache:  options.componentTagCache,
		tagCapturePatterns: options.tagCapturePatterns,
	});

	const paths = Array.from(tagCache).map(([ _, path ]) => path);
	const manifest = createManifest(paths);
	const cache: Map<string, Declarations> = new Map();

	for (const module of manifest.modules) {
		for (const dec of module.declarations) {
			if (dec.customElement)
				cache.set(dec.tagName!, dec);
		}
	}

	return cache;
};
