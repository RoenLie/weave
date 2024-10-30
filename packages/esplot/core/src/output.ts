import { build  } from 'vite';
import { platform, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { readFileSync, unlinkSync } from 'node:fs';
import { spawn } from 'node:child_process';


export const output = async (code: string) => {
	const tempDir = join(tmpdir(), 'esplot');
	const filePath = join(tempDir, 'plot.js');

	await build({
		appType:    'custom',
		configFile: false,
		logLevel:   'silent',
		build:      {
			emptyOutDir: false,
			outDir:      tempDir,
			lib:         {
				entry:    '',
				formats:  [ 'es' ],
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

	const os = platform();
	if (os !== 'win32' && os !== 'darwin')
		throw new Error('only supports win and darwin');

	const plotViewerDir = join(resolve(), 'bin');
	const plotViewerPath = join(plotViewerDir,
		'esplotv' + (os === 'win32' ? '-win32' : '-arm64'));

	let viewerIsActive = false;
	try {
		await fetch('http://localhost:46852');
		viewerIsActive = true;
	}
	catch { /*  */ }

	if (viewerIsActive)
		return await sendHtml(fileContent);

	const child = spawn(plotViewerPath, {
		stdio:       'ignore',
		shell:       true,
		windowsHide: true,
		detached:    true,
	});
	child.unref();

	await sendHtml(fileContent);
};

const sendHtml = async (fileContent: string) => {
	let gotConnection = false;

	while (!gotConnection) {
		try {
			gotConnection = await fetch('http://localhost:46852/new', {
				method: 'POST',
				body:   html(fileContent),
			}).then(res => res.status === 200);
		}
		catch {
			console.log('Esplot: not running, waiting for it to start...');
			await new Promise<void>(res => setTimeout(() => res(), 500));
		}
	}

	console.log('Esplot: opening plot...');
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
