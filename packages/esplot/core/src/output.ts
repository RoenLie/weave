import { build  } from 'vite';
import { platform, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { Writable } from 'node:stream';


export const output = async (code: string) => {
	const tempPath = join(tmpdir(), 'esplot');
	const filePath = join(tempPath, 'plot.js');

	await build({
		appType:    'custom',
		configFile: false,
		logLevel:   'silent',
		build:      {
			emptyOutDir: false,
			outDir:      tempPath,
			lib:         {
				entry:    '',
				formats:  [ 'cjs' ],
				fileName: () => 'plot.js',
			},
			rollupOptions: {
				treeshake: true,
				input:     'plot.js',
				output:    {
					manualChunks:    () => 'plot.js',
					preserveModules: false,
					sourcemap:       false,
				},
			},
		},
		plugins: [
			{
				name:    'resolve-html-entrypoint',
				enforce: 'pre',
				resolveId(source, _importer, options) {
					if (source === 'plot.js' && options.isEntry)
						return source;
				},
				load: (id: string) => {
					if (id === 'plot.js')
						return code;
				},
			},
		],
	});

	const fileContent = readFileSync(filePath, 'utf8');
	unlinkSync(filePath);

	const tempHtmlPath = join(tempPath, 'index.html');
	writeFileSync(tempHtmlPath, html(fileContent));

	const os = platform();
	if (os !== 'win32' && os !== 'darwin')
		throw new Error('only supports win and darwin');

	const plotViewerDir = join(resolve(), 'bin');
	const plotViewerPath = join(plotViewerDir, 'esplotv' + (os === 'win32' ? '-win32' : '-arm64'));

	const child = spawn(plotViewerPath, [ tempHtmlPath ], {
		stdio:       'ignore',
		shell:       true,
		windowsHide: true,
		detached:    true,
	});
	child.unref();

	const { promise, resolve: res } = Promise.withResolvers<void>();

	child.once('spawn', async () => {
		await new Promise<void>(res => setTimeout(() => res(), 1000));
		res();
		unlinkSync(tempHtmlPath);
	});

	console.log('Opening a new window with your plot...');
	await promise;
};

const html = (code: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>ESPlot</title>
	<style>
	body {
		height: 100vh;
		overflow: hidden;
		contain: strict;
		display: grid;
		place-content: center;
		margin: 0px;
		padding: 0px;
	}
	canvas {
		width: 100%;
		height: 100%;
	}
	</style>
	<script type="module">${ code }</script>
</head>
<body>
<canvas></canvas>
</body>
</html>
`;
