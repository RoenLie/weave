import { build  } from 'vite';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';


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
	writeFileSync(tempHtmlPath, html.replace('$$', fileContent));

	const plotViewerDir = join(resolve(), '..', 'viewer');
	const plotViewerPath = join(plotViewerDir, 'esplotv');

	const child = spawn(plotViewerPath, [ tempHtmlPath ], {
		stdio:    'ignore',
		detached: true,
		shell:    true,
	});

	child.unref();
	child.once('spawn', async () => {
		await new Promise((resolve) => setTimeout(resolve, 100));
		unlinkSync(tempHtmlPath);
	});

	console.log('Opening a new window with your plot...');
};

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>ESPlot</title>
	<style>
	body {
		height: 100vh;
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
	<script type="module">$$</script>
</head>
<body>
<canvas id="acquisitions"></canvas>
</body>
</html>
`;
