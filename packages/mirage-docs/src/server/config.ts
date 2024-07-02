import { promises } from 'node:fs';
import { join, normalize, resolve, sep } from 'node:path';

import { persistToFile } from '@orama/plugin-data-persistence/server';
import { deepmerge, deepmergeInto } from 'deepmerge-ts';
import copy from 'rollup-plugin-copy';
import { type ConfigEnv, defineConfig, type UserConfig } from 'vite';

import { createCache } from './build/cache/cache-registry.js';
import { setDevMode } from './build/helpers/is-dev-mode.js';
import { type ConfigProperties, createDocFiles, type InternalConfigProperties } from './create-files.js';
import { createPlugin } from './create-plugin.js';
import { ConsoleBar } from './progress-bar.js';


const pRoot = resolve();
const outDir = join(resolve(), 'dist');


export const defineDocConfig = async (
	docsiteConfig: (env: ConfigEnv) => ConfigProperties | Promise<ConfigProperties>,
	viteConfig: (env: ConfigEnv) => Omit<UserConfig, 'root' | 'base'> | Promise<Omit<UserConfig, 'root' | 'base'>>,
) => {
	return defineConfig(async env => {
		const props = await docsiteConfig(env);
		const config = await viteConfig(env);

		if (!props.root.startsWith('/'))
			throw new SyntaxError('property `root` must start with /');
		if (!props.source.startsWith('/'))
			throw new SyntaxError('property `entryDir` must start with /');

		console.log('Mirage Docs creating and setting up environment...');
		const bar = new ConsoleBar({
			formatString:  '#spinner ##blue#bar ##default##dim#count ##default##bright#message',
			hideCursor:    true,
			enableSpinner: true,
			total:         5,
			doneSymbol:    '■',
			undoneSymbol:  ' ',
		});

		// We enforce it to start with a leading /, then we add a . to make it relative.
		props.source = '.' + props.source;

		// We enforce it to start with / for consistency, then we remove it.
		props.root = props.root.replace(/^\/|^\\/, '');

		// Always include the main index.html file.
		props.input ??= [];
		props.input.push(normalize(join(pRoot, props.root, 'index.html')));

		// We by default look for tags where the entry dir is.
		props.tagDirs ??= [];
		props.tagDirs.push({ path: props.source });

		setDevMode(false);

		const internalProps: InternalConfigProperties =  {
			debug:          false,
			hmrReloadDelay: 100,
			base:           '',
			source:         '',
			root:           '',
			input:          [],
			tagDirs:        [],
			siteConfig:     {
				env: {
					rootDir:  props.root,
					entryDir: props.source,
					libDir:   '.mirage',
					base:     props.base,
				},
				root: {
					styleImports:  [],
					scriptImports: [],
					layout:        {
						headingText: '',
						logoHeight:  '',
						logoSrc:     '',
					},
					sidebar: {
						delimiter:        '_',
						nameReplacements: [
							[ '.docs', '' ],
							[ '.editor', ' Editor' ],
							[ '-', ' ' ],
						],
					},
					styleOverrides: {
						layout:       '',
						sidebar:      '',
						metadata:     '',
						pathTree:     '',
						cmpEditor:    '',
						sourceEditor: '',
						pageHeader:   '',
						pageTemplate: '',
					},
				},
				pages: {
					darkTheme:  '',
					lightTheme: '',
					styles:     [],
					scripts:    [],
				},
			},
		};

		deepmergeInto(internalProps, props);

		// Cache all relevant files.
		bar.update(bar.current + 1, 'Caching files');

		await createCache(internalProps);

		bar.update(bar.current + 1, 'Creating file scaffolding');

		const {
			filesToCreate,
			oramaDb,
			markdownComponentPaths,
			siteconfigImportPath,
			absoluteLibDir,
			absoluteSourceDir,
		} = await createDocFiles(internalProps);

		bar.update(bar.current + 1, 'Finished creating file scaffolding');

		const docConfig: UserConfig = {
			appType: 'spa',
			base:    internalProps.base,
			root:    join(pRoot, internalProps.root),
			build:   {
				rollupOptions: {
					input: internalProps.input,
				},
			},
			plugins: [
				createPlugin({
					props: internalProps,
					markdownComponentPaths,
					siteconfigImportPath,
					absoluteLibDir,
					absoluteSourceDir,
				}),
			],
		};

		const mergedConfig = deepmerge(config, docConfig);

		mergedConfig.publicDir ||= 'public';
		mergedConfig.build ??= {};
		mergedConfig.build.outDir ??= outDir;
		mergedConfig.build.emptyOutDir ??= true;
		mergedConfig.plugins?.push(
			copy({
				targets: [
					{
						src:  './node_modules/@roenlie/mirage-docs/dist/workers',
						dest: join(internalProps.root, mergedConfig.publicDir, '.mirage'),
					},
				],
				hook:     'config',
				copyOnce: true,
			}) as any,
		);

		mergedConfig.build.rollupOptions ??= {};
		mergedConfig.build.rollupOptions.output ??= {};
		if (Array.isArray(mergedConfig.build.rollupOptions.output))
			throw new Error('Mirage Docs does not support: rollupOptions => output as an Array.');

		mergedConfig.build.rollupOptions.output.manualChunks = (id) => {
			if (id.includes('monaco-editor'))
				return 'monaco-editor';
			if (id.endsWith('siteconfig.ts'))
				return 'site-config';
		};

		// Write the mirage files to mirage disc location.
		bar.update(bar.current + 1, 'Writing files to disk');

		await Promise.all([ ...filesToCreate ].map(async ([ path, content ]) => {
			internalProps.debug && console.log('Attempting to write file:', path);

			await promises.mkdir(path.split(sep).slice(0, -1).join(sep), { recursive: true });
			await promises.writeFile(path, content);

			internalProps.debug && console.log('Finished writing file:', path);
		}));

		// Write the search index file to public disc folder.
		bar.update(bar.current + 1, 'Writing search indexes to disk');

		const searchDir = join(pRoot, internalProps.root, mergedConfig.publicDir, '.mirage');
		await promises.mkdir(searchDir, { recursive: true });
		await persistToFile(oramaDb, 'json', join(searchDir, 'searchIndexes.json'));

		// creating a newline so that progress is not too close to vite output.
		console.log('');

		return mergedConfig;
	});
};
