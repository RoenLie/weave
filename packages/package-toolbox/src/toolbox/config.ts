import fsp from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { build } from 'tsup';

import { type ToolboxConfig } from './define-toolbox.js';


export const loadConfigWithTsup = async (filePath: string) => {
	const ext = '.mjs';
	const fileBase = `${ filePath }.timestamp-${ Date.now() }-${ Math.random()
		.toString(16)
		.slice(2) }`;

	const fileNameTmp = `${ fileBase }`;
	const fileUrl = `${ pathToFileURL(fileBase) }${ ext }`;

	const pathIn = filePath;

	await build({
		entry:        { [fileNameTmp]: pathIn },
		format:       'esm',
		outDir:       './',
		splitting:    false,
		outExtension: () => ({ js: ext }),
		silent:       true,
		treeshake:    true,
	});

	const imp: () => Promise<ToolboxConfig> = await import(fileUrl).then(m => m.default);

	try {
		return await imp();
	}
	finally {
		fsp.unlink(fileNameTmp + ext);
	}
};
