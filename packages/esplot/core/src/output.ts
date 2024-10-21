import { build  } from 'vite';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';


export const output = async () => {
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
					if (id === 'plot.js') {
						return `
						import Chart from 'chart.js/auto'

						(async function() {
						const data = [
							{ year: 2010, count: 10 },
							{ year: 2011, count: 20 },
							{ year: 2012, count: 15 },
							{ year: 2013, count: 25 },
							{ year: 2014, count: 22 },
							{ year: 2015, count: 30 },
							{ year: 2016, count: 28 },
						];

						new Chart(
							document.getElementById('acquisitions'),
							{
								type: 'bar',
								data: {
								labels: data.map(row => row.year),
								datasets: [
									{
										label: 'Acquisitions by year',
										data: data.map(row => row.count)
									}
								]
								}
							}
						);
						})();
						`;
					}
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

	console.log('Plotting...', tempPath);
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
