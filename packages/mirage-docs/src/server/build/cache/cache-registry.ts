import type { Declarations } from '../../../shared/metadata.types.js';
import type { InternalConfigProperties } from '../../config.js';
import { createManifestCache } from '../manifest/create-manifest-cache.js';
import { createFileCache, type FilePathCache } from './create-file-cache.js';
import { createTagCache } from './create-tag-cache.js';


let manifest: Map<string, Declarations>;
let tag: Map<string, string>;
let editor: FilePathCache;
let markdown: FilePathCache;


export const createCache = async (props: InternalConfigProperties): Promise<void> => {
	[ manifest, tag, editor, markdown ] = await Promise.all([
		createManifestCache({ directories: props.tagDirs! }),
		createTagCache({ directories: props.tagDirs! }),
		createFileCache({ directories: [ { path: props.source, pattern: /\.editor\.ts/ } ] }),
		createFileCache({ directories: [ { path: props.source, pattern: /\.md/ } ] }),
	]);
};


export const getCache = (): {
	manifest: Map<string, Declarations>;
	tag:      Map<string, string>;
	editor:   FilePathCache;
	markdown: FilePathCache;
} => {
	return { manifest, tag, editor, markdown };
};
