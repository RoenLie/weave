import type { CustomElementManifest, Declarations } from '../../../shared/metadata.types.js';
import { createTagCache } from '../cache/create-tag-cache.js';
import { createManifest } from './create.js';


export const createManifestCache = async (options: {
	directories: { path: string; whitelist?: RegExp[]; blacklist?: RegExp[] }[];
	componentTagCache?: Map<string, string>;
	tagCapturePatterns?: RegExp[];
} | Map<string, string>) => {
	/** Map of tag and path to where that component is declared */
	const tagCache = options instanceof Map ? options : await createTagCache({
		directories:        options.directories,
		componentTagCache:  options.componentTagCache,
		tagCapturePatterns: options.tagCapturePatterns,
	});

	const paths = Array.from(tagCache).map(([ _, path ]) => path);

	const manifest = createManifest(paths) as CustomElementManifest;
	const cache = new Map<string, Declarations>();

	manifest.modules.forEach(module => module.declarations.forEach(dec => {
		if (!dec.customElement)
			return;

		cache.set(dec.tagName!, dec);
	}));

	return cache;
};
