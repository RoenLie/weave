/* eslint-disable @stylistic/max-len */
import type { Plugin } from 'vite';


export type ExtractFn<T> = Extract<T, (...args: any[]) => any>;
export type PluginParams = {
	[ R in keyof Plugin as [ExtractFn<Plugin[R]>] extends [never] ? never : R ]-?:
	[context: ThisParameterType<ExtractFn<Plugin[R]>>, ...Parameters<ExtractFn<Plugin[R]>>]
};
export type PluginSyncFnReturn<R extends keyof PluginParams> = Awaited<ReturnType<ExtractFn<Plugin[R]>>>;
export type PluginAsyncFnReturn<R extends keyof PluginParams> = Promise<Awaited<ReturnType<ExtractFn<Plugin[R]>>>>;
export type PluginFnReturn<R extends keyof PluginParams> = PluginSyncFnReturn<R> | PluginAsyncFnReturn<R>;
export type IVitePlugin = {
	[R in keyof PluginParams]?: (args: PluginParams[R]) => PluginSyncFnReturn<R> | PluginAsyncFnReturn<R>;
} & {
	enforce: Plugin['enforce'];
	name:    string;
};


export class VitePlugin implements IVitePlugin {

	constructor(...args: any[]) {}

	name:    string;
	enforce: Plugin['enforce'];

	// Build hooks
	closeWatcher               ?(args: PluginParams['closeWatcher']):                PluginFnReturn<'closeWatcher'>;
	moduleParsed               ?(args: PluginParams['moduleParsed']):                PluginFnReturn<'moduleParsed'>;
	buildEnd                   ?(args: PluginParams['buildEnd']):                    PluginFnReturn<'buildEnd'>;
	buildStart                 ?(args: PluginParams['buildStart']):                  PluginFnReturn<'buildStart'>;
	options                    ?(args: PluginParams['options']):                     PluginFnReturn<'options'>;
	onLog                      ?(args: PluginParams['onLog']):                       PluginSyncFnReturn<'onLog'>;
	watchChange                ?(args: PluginParams['watchChange']):                 PluginFnReturn<'watchChange'>;
	load                       ?(args: PluginParams['load']):                        PluginFnReturn<'load'>;
	transform                  ?(args: PluginParams['transform']):                   PluginFnReturn<'transform'>;
	resolveId                  ?(args: PluginParams['resolveId']):                   PluginFnReturn<'resolveId'>;
	resolveDynamicImport       ?(args: PluginParams['resolveDynamicImport']):        PluginFnReturn<'resolveDynamicImport'>;
	shouldTransformCachedModule?(args: PluginParams['shouldTransformCachedModule']): PluginFnReturn<'shouldTransformCachedModule'>;

	// Output hooks
	augmentChunkHash           ?(args: PluginParams['augmentChunkHash']):            PluginSyncFnReturn<'augmentChunkHash'>;
	banner                     ?(args: PluginParams['banner']):                      PluginFnReturn<'banner'>;
	closeBundle                ?(args: PluginParams['closeBundle']):                 PluginFnReturn<'closeBundle'>;
	footer                     ?(args: PluginParams['footer']):                      PluginFnReturn<'footer'>;
	intro                      ?(args: PluginParams['intro']):                       PluginFnReturn<'intro'>;
	outro                      ?(args: PluginParams['outro']):                       PluginFnReturn<'outro'>;
	renderError                ?(args: PluginParams['renderError']):                 PluginFnReturn<'renderError'>;
	outputOptions              ?(args: PluginParams['outputOptions']):               PluginSyncFnReturn<'outputOptions'>;
	renderDynamicImport        ?(args: PluginParams['renderDynamicImport']):         PluginSyncFnReturn<'renderDynamicImport'>;
	resolveFileUrl             ?(args: PluginParams['resolveFileUrl']):              PluginSyncFnReturn<'resolveFileUrl'>;
	writeBundle                ?(args: PluginParams['writeBundle']):                 PluginFnReturn<'writeBundle'>;
	resolveImportMeta          ?(args: PluginParams['resolveImportMeta']):           PluginSyncFnReturn<'resolveImportMeta'>;
	generateBundle             ?(args: PluginParams['generateBundle']):              PluginFnReturn<'generateBundle'>;
	renderChunk                ?(args: PluginParams['renderChunk']):                 PluginFnReturn<'renderChunk'>;
	renderStart                ?(args: PluginParams['renderStart']):                 PluginFnReturn<'renderStart'>;

	// Vite hooks
	handleHotUpdate            ?(args: PluginParams['handleHotUpdate']):             PluginFnReturn<'handleHotUpdate'>;
	configResolved             ?(args: PluginParams['configResolved']):              PluginFnReturn<'configResolved'>;
	configureServer            ?(args: PluginParams['configureServer']):             PluginFnReturn<'configureServer'>;
	configurePreviewServer     ?(args: PluginParams['configurePreviewServer']):      PluginFnReturn<'configurePreviewServer'>;
	hotUpdate                  ?(args: PluginParams['hotUpdate']):                   PluginFnReturn<'hotUpdate'>;
	transformIndexHtml         ?(args: PluginParams['transformIndexHtml']):          PluginFnReturn<'transformIndexHtml'>;
	config                     ?(args: PluginParams['config']):                      PluginFnReturn<'config'>;
	apply                      ?(args: PluginParams['apply']):                       PluginSyncFnReturn<'apply'>;
	applyToEnvironment         ?(args: PluginParams['applyToEnvironment']):          PluginSyncFnReturn<'applyToEnvironment'>;
	configEnvironment          ?(args: PluginParams['configEnvironment']):           PluginFnReturn<'configEnvironment'>;
	api                        ?(args: PluginParams['api']):                         PluginFnReturn<'api'>;

}


export const vitePluginClassToPlugin = <T extends typeof VitePlugin>(cls: T): (...options: ConstructorParameters<T>) => Plugin => {
	return (...options) => {
		const plugin = new cls(...options);

		return {
			enforce: plugin.enforce,
			name:    plugin.name,

			// Build hooks
			closeWatcher:                plugin.closeWatcher                ? function(...args) { return plugin.closeWatcher               !([ this, ...args ]); } : undefined,
			moduleParsed:                plugin.moduleParsed                ? function(...args) { return plugin.moduleParsed               !([ this, ...args ]); } : undefined,
			buildEnd:                    plugin.buildEnd                    ? function(...args) { return plugin.buildEnd                   !([ this, ...args ]); } : undefined,
			buildStart:                  plugin.buildStart                  ? function(...args) { return plugin.buildStart                 !([ this, ...args ]); } : undefined,
			options:                     plugin.options                     ? function(...args) { return plugin.options                    !([ this, ...args ]); } : undefined,
			onLog:                       plugin.onLog                       ? function(...args) { return plugin.onLog                      !([ this, ...args ]); } : undefined,
			watchChange:                 plugin.watchChange                 ? function(...args) { return plugin.watchChange                !([ this, ...args ]); } : undefined,
			load:                        plugin.load                        ? function(...args) { return plugin.load                       !([ this, ...args ]); } : undefined,
			transform:                   plugin.transform                   ? function(...args) { return plugin.transform                  !([ this, ...args ]); } : undefined,
			resolveId:                   plugin.resolveId                   ? function(...args) { return plugin.resolveId                  !([ this, ...args ]); } : undefined,
			resolveDynamicImport:        plugin.resolveDynamicImport        ? function(...args) { return plugin.resolveDynamicImport       !([ this, ...args ]); } : undefined,
			shouldTransformCachedModule: plugin.shouldTransformCachedModule ? function(...args) { return plugin.shouldTransformCachedModule!([ this, ...args ]); } : undefined,
			// Output hooks
			augmentChunkHash:            plugin.augmentChunkHash            ? function(...args) { return plugin.augmentChunkHash           !([ this, ...args ]); } : undefined,
			banner:                      plugin.banner                      ? function(...args) { return plugin.banner                     !([ this, ...args ]); } : undefined,
			closeBundle:                 plugin.closeBundle                 ? function(...args) { return plugin.closeBundle                !([ this, ...args ]); } : undefined,
			footer:                      plugin.footer                      ? function(...args) { return plugin.footer                     !([ this, ...args ]); } : undefined,
			intro:                       plugin.intro                       ? function(...args) { return plugin.intro                      !([ this, ...args ]); } : undefined,
			outro:                       plugin.outro                       ? function(...args) { return plugin.outro                      !([ this, ...args ]); } : undefined,
			renderError:                 plugin.renderError                 ? function(...args) { return plugin.renderError                !([ this, ...args ]); } : undefined,
			outputOptions:               plugin.outputOptions               ? function(...args) { return plugin.outputOptions              !([ this, ...args ]); } : undefined,
			renderDynamicImport:         plugin.renderDynamicImport         ? function(...args) { return plugin.renderDynamicImport        !([ this, ...args ]); } : undefined,
			resolveFileUrl:              plugin.resolveFileUrl              ? function(...args) { return plugin.resolveFileUrl             !([ this, ...args ]); } : undefined,
			writeBundle:                 plugin.writeBundle                 ? function(...args) { return plugin.writeBundle                !([ this, ...args ]); } : undefined,
			resolveImportMeta:           plugin.resolveImportMeta           ? function(...args) { return plugin.resolveImportMeta          !([ this, ...args ]); } : undefined,
			generateBundle:              plugin.generateBundle              ? function(...args) { return plugin.generateBundle             !([ this, ...args ]); } : undefined,
			renderChunk:                 plugin.renderChunk                 ? function(...args) { return plugin.renderChunk                !([ this, ...args ]); } : undefined,
			renderStart:                 plugin.renderStart                 ? function(...args) { return plugin.renderStart                !([ this, ...args ]); } : undefined,
			// Vite hooks
			handleHotUpdate:             plugin.handleHotUpdate             ? function(...args) { return plugin.handleHotUpdate            !([ this, ...args ]); } : undefined,
			configResolved:              plugin.configResolved              ? function(...args) { return plugin.configResolved             !([ this, ...args ]); } : undefined,
			configureServer:             plugin.configureServer             ? function(...args) { return plugin.configureServer            !([ this, ...args ]); } : undefined,
			configurePreviewServer:      plugin.configurePreviewServer      ? function(...args) { return plugin.configurePreviewServer     !([ this, ...args ]); } : undefined,
			hotUpdate:                   plugin.hotUpdate                   ? function(...args) { return plugin.hotUpdate                  !([ this, ...args ]); } : undefined,
			transformIndexHtml:          plugin.transformIndexHtml          ? function(...args) { return plugin.transformIndexHtml         !([ this, ...args ]); } : undefined,
			config:                      plugin.config                      ? function(...args) { return plugin.config                     !([ this, ...args ]); } : undefined,
			apply:                       plugin.apply                       ? function(...args) { return plugin.apply                      !([ this, ...args ]); } : undefined,
			configEnvironment:           plugin.configEnvironment           ? function(...args) { return plugin.configEnvironment          !([ this, ...args ]); } : undefined,
			applyToEnvironment:          plugin.applyToEnvironment          ? function(this: any, ...args) { return plugin.applyToEnvironment!([ this, ...args ]); } : undefined,
			api:                         plugin.api                         ? function(this: any, ...args: any[]) { return plugin.api!([ this, ...args ]); } : undefined,
		};
	};
};
