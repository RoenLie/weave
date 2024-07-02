import { promises } from 'node:fs';

import { type ITrackedPromise, TrackedPromise } from '@roenlie/mimic-core/async';
import { withDebounce } from '@roenlie/mimic-core/timing';
import type { ModuleNode, Plugin, ResolvedConfig } from 'vite';

import { getCache } from './build/cache/cache-registry.js';
import { componentAutoImportLoad } from './build/component/auto-import.js';
import { DocPath } from './build/helpers/docpath.js';
import { fileExt } from './build/helpers/is-dev-mode.js';
import type { InternalConfigProperties } from './create-files.js';
import { MarkdownComponentFactory } from './create-markdown-cmp.js';


export const createPlugin = (args: {
	props: InternalConfigProperties;
	markdownComponentPaths: Set<string>;
	siteconfigImportPath: string;
	absoluteLibDir: string;
	absoluteSourceDir: string;
}): Plugin => {
	let config: ResolvedConfig;
	const cache = getCache();
	const {
		props,
		markdownComponentPaths,
		siteconfigImportPath,
		absoluteLibDir,
		absoluteSourceDir,
	} = args;

	let reloadPromise: ITrackedPromise<ModuleNode[]> | undefined = undefined;
	let hmrModules: ModuleNode[] = [];
	const debounceHotReload = withDebounce(
		(modules: ModuleNode[]) => hmrModules.push(...modules),
		() => {
			reloadPromise?.resolve(hmrModules);
			reloadPromise = undefined;
			hmrModules = [];
		},
		props.hmrReloadDelay || 0,
	);

	return {
		name: 'mirage-docs',
		configResolved(cfg) {
			config = cfg;
		},
		transformIndexHtml: {
			order:   'pre',
			handler: (html, ctx) => {
				// Only transform the root index.html file.
				// This isn't a perfect way to check, but we are not generating other index.html
				// files in mirage-docs, so it can only fail if user ends up adding one as an input.
				if (!ctx.filename.endsWith('index.html'))
					return;

				return {
					html,
					tags: [
						{
							tag:      'script',
							attrs:    { type: 'module' },
							injectTo: 'head-prepend',
							children: 'import "@roenlie/mirage-docs/assets/index.css"',
						},
						{
							tag:   'script',
							attrs: {
								id:   'site-config',
								type: 'module',
								src:  siteconfigImportPath,
							},
							injectTo: 'head-prepend',
						},
						{
							tag:      'script',
							attrs:    { type: 'module' },
							injectTo: 'head',
							children: `
							import { LayoutCmp } from "@roenlie/mirage-docs/app/components/layout/layout.cmp.${ fileExt() }"
							LayoutCmp.register();
							document.body.appendChild(document.createElement('midoc-layout'));
							`,
						},
					],
				};
			},
		},
		buildStart() {
			// Watch markdown files for changes.
			for (const [ , path ] of cache.markdown)
				this.addWatchFile(path);
		},
		load(id) {
			this.addWatchFile(id);

			/* if auto importer is being used, transform matching modules */
			if (props.autoImport) {
				const transformed = componentAutoImportLoad({
					id,
					config,
					tagCache:       cache.tag,
					tagPrefixes:    props.autoImport.tagPrefixes,
					loadWhitelist:  props.autoImport.loadWhitelist,
					loadBlacklist:  props.autoImport.loadBlacklist,
					tagCaptureExpr: props.autoImport.tagCaptureExpr,
				});

				if (transformed)
					return transformed;
			}
		},
		transform(code, id) {
			if (id.endsWith('.editor.ts')) {
				code = `const EditorComponent = (builder) => builder;\n` + code;

				return code;
			}

			// Add custom hot reload handling for main component when in dev mode.
			if (config.env['DEV'] && markdownComponentPaths.has(id)) {
				code = `
				const __$original = window.customElements.define;
				window.customElements.define = function(...args) {
					try {
						__$original.call(this, ...args);
					} catch(err) { /*  */ }
				}
				\n` + code + `
				if (import.meta.hot) {
					const reload = () => window.top?.postMessage('hmrReload', location.origin);
					import.meta.hot.accept();
					import.meta.hot.on('vite:beforeUpdate', reload);
				}
				`;

				return code;
			}
		},
		async handleHotUpdate(ctx) {
			if (props.hmrReloadDelay) {
				debounceHotReload(ctx.modules);
				if (reloadPromise)
					return [];

				return await (reloadPromise = new TrackedPromise());
			}
		},
		async watchChange(id) {
			if (!id.endsWith('.md'))
				return;

			const absoluteCmpPath = DocPath.createFileCachePath(
				id, absoluteSourceDir, absoluteLibDir, 'ts',
			);

			const rootDepth = props.root.split('/').filter(Boolean).length;
			const factory = new MarkdownComponentFactory({ path: id, rootDepth });
			const file = await factory.create();

			await promises.writeFile(absoluteCmpPath, file);
		},
	};
};
