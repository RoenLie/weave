import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { transform } from 'lightningcss';
import MagicString from 'magic-string';
import { parseAndWalk } from 'oxc-walker';
import  * as sass from 'sass';
import type { Plugin, ResolvedConfig } from 'vite';

import type { PluginAsyncFnReturn, PluginParams, PluginSyncFnReturn } from './vite-plugin.ts';
import { VitePlugin, vitePluginClassToPlugin } from './vite-plugin.ts';


class SassTransformer implements VitePlugin {

	constructor(options?: Partial<SassTransformer['inputOptions']>) {
		this.inputOptions = {
			minify:     true,
			rootDir:    '',
			debugLevel: 'silent',
			...options,
		};
	}

	readonly inputOptions: Readonly<{
		minify:     boolean;
		rootDir:    string;
		debugLevel: 'error' | 'silent';
	}>;

	enforce:          Plugin['enforce'] = 'pre';
	name:             string = '@roenlie/vite-plugin-sass-transformer';
	resolvedConfig:   ResolvedConfig;
	decoder:          TextDecoder = new TextDecoder();
	identifierNames:  string[] = [ 'sass`', 'scss`' ];
	sourcetypes:      Set<string> = new Set([ '.scss', '.sass' ]);
	filetypes:        Set<string> = new Set([ '.ts', '.mts', '.js', '.mjs' ]);
	transformers:     ((code: string, id: string) => string)[] = [];
	additionalCode:   string[] = [];
	virtualModules:   Map<string, string> = new Map();
	charReplacements: Map<string, string> = new Map([
		[ '\\', '\\\\' ],
		[ '`', '\\`' ],
		[ '$', '\\$' ],
	]);

	protected convert(str: string): string {
		let res = '';
		for (const c of str)
			res += this.charReplacements.get(c) || c;

		return `\`${ res }\``;
	}

	protected cssImportAssertRegex(str: string): RegExp {
		return new RegExp(str + `['"] *(?:with|assert) *{ *type: *['"](?:css|scss|sass)['"]`);
	}

	protected fromSASSToCSS(text: string): string | undefined {
		try {
			return sass.compileString(text, {
				importers: [
					{
						findFileUrl: (url) => {
							const path = pathToFileURL(join(
								this.resolvedConfig.root,
								this.inputOptions.rootDir,
							));

							return new URL(url, path + '/');
						},
					},
				],
			}).css;
		}
		catch (err) {
			if (this.inputOptions.debugLevel !== 'silent') {
				console.error('Failed to compile sass literal');
				console.error(err);
			}
		}
	}

	protected minifyCSS(text: string, id: string = 'unknown'): string | undefined {
		try {
			const { code: output } = transform({
				code:     Buffer.from(text),
				filename: id,
				minify:   true,
			});

			return this.decoder.decode(output);
		}
		catch (err) {
			if (this.inputOptions.debugLevel !== 'silent') {
				console.error('Failed to minify css literal');
				console.error(err);
			}
		}
	}

	//#region Plugin Hooks
	configResolved(
		[ context, cfg ]: PluginParams['configResolved'],
	): PluginSyncFnReturn<'configResolved'> {
		this.resolvedConfig = cfg;
	}

	async resolveId(
		[ context, source, importer, options ]: PluginParams[ 'resolveId' ],
	): PluginAsyncFnReturn<'resolveId'> {
		const sourceExt = extname(source);
		if (!this.sourcetypes.has(sourceExt) || !importer)
			return;

		// Remove query string part of path.
		// Vite sometimes adds this to .html files.
		if (importer.includes('?'))
			importer = importer.split('?')[0]!;

		const ext = extname(importer);
		if (!this.filetypes.has(ext))
			return;

		const resolvedId = (await context.resolve(source, importer, options))?.id;
		if (!resolvedId)
			return;

		const importerContent = await readFile(importer, { encoding: 'utf8' });
		const regxp = this.cssImportAssertRegex(source);

		if (regxp.test(importerContent)) {
			const modId = '\0virtual:' + source.replace(extname(source), '.stylesheet');
			this.virtualModules.set(modId, resolvedId);

			return modId;
		}
	}

	async load(
		[ context, id, options ]: PluginParams['load'],
	): PluginAsyncFnReturn<'load'> {
		if (!this.virtualModules.has(id))
			return;

		const realId = this.virtualModules.get(id)!;

		let fileContent = await readFile(realId, { encoding: 'utf8' });
		context.addWatchFile(realId);

		for (const transform of this.transformers)
			fileContent = transform(fileContent, realId);

		let compiled = this.fromSASSToCSS(fileContent);
		if (!compiled)
			return;

		if (this.inputOptions.minify) {
			compiled = this.minifyCSS(compiled, realId);
			if (!compiled)
				return;
		}

		const createCode =
		`const styles = ${ this.convert(compiled) }`
		+ `\n${ this.additionalCode.join('\n') }`
		+ '\nconst sheet = new CSSStyleSheet();'
		+ '\nsheet.replaceSync(styles);'
		+ '\nexport default sheet;';

		return createCode;
	}

	transform(
		[ context, code, id, options ]: PluginParams['transform'],
	): PluginSyncFnReturn<'load'> {
		const ext = extname(id);
		if (!this.filetypes.has(ext))
			return;
		if (!this.identifierNames.some(name => code.includes(name)))
			return;

		const replacements: { from: string; to: string; }[] = [];

		parseAndWalk(code, id, (node, parent, ctx) => {
			if (node.type !== 'TaggedTemplateExpression')
				return;
			if (node.tag.type !== 'Identifier')
				return;

			const identifier = node.tag.name + '`';
			if (!this.identifierNames.includes(identifier))
				return;


			const start = node.quasi.start! + 1;
			const end = node.quasi.end! - 1;

			const text = code.slice(start, end);
			if (!text)
				return;

			let compiled = this.fromSASSToCSS(text);
			if (!compiled)
				return;

			if (this.inputOptions.minify) {
				compiled = this.minifyCSS(compiled, id);
				if (!compiled)
					return;
			}

			// we cannot mutate the code string while traversing.
			// so we gather the text changes that need to be done.
			// we push the latest changes to the beginning of the array
			// so that as we apply the changes, the indexes are still valid.
			replacements.unshift({ from: text, to: compiled });
		});

		if (!replacements.length)
			return;

		try {
			const str = new MagicString(code);
			for (const { from, to } of replacements)
				str.replace(from, to);

			return {
				code: str.toString(),
				map:  str.generateMap({ file: id }),
			};
		}
		catch (err) {
			if (this.inputOptions.debugLevel !== 'silent') {
				console.error('\nFailed to apply sass transformation and minification: ' + id);
				console.error(err);
			}
		}
	}
	//#endregion Plugin Hooks

}


export const transformSass = vitePluginClassToPlugin(SassTransformer);
