import fsp from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { type ToolboxConfig } from './define-toolbox.js';
import { build } from 'vite';


export const loadConfig = async (filePath: string) => {
	const ext = '.mjs';
	const fileBase = filePath.replace('.ts', '.')
		+ crypto.randomUUID().split('-').at(-1);

	const fileNameTmp = fileBase.replace(/^\.+\//, '') + ext;
	const fileUrl = `${ pathToFileURL(fileBase) }${ ext }`;

	await build({
		configFile: false,
		logLevel:   'silent',
		build:      {
			outDir:      '.',
			emptyOutDir: false,
			lib:         {
				entry:    filePath,
				formats:  [ 'es' ],
				fileName: () => fileNameTmp,
			},
			rollupOptions: {
				treeshake: true,
				input:     filePath,
				output:    {
					manualChunks:    () => fileNameTmp,
					preserveModules: false,
					sourcemap:       false,
				},
			},
		},
	});

	const imp: () => Promise<ToolboxConfig> = await import(fileUrl)
		.then(m => m.default);

	try {
		return await imp();
	}
	finally {
		fsp.unlink(fileNameTmp);
	}
};
