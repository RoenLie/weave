import fsp from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { build } from 'vite';

import type { ToolboxConfig } from './define-toolbox.js';


export const loadConfig = async (filePath: string): Promise<ToolboxConfig> => {
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
				entry:    '',
				formats:  [ 'es' ],
				fileName: () => fileNameTmp,
			},
			rollupOptions: {
				treeshake: true,
				input:     filePath,

				external(source) {
					// Returns true for any import using the standard external package syntax.
					// Returns false for any absolute or relative path.
					const expression = /^(?!\w+:[/\\])@?[\w]+[\w\-/.:]+$/;

					return expression.test(source);
				},

				output: {
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
