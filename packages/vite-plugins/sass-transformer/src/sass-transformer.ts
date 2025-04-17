import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';

import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
import { transform } from 'lightningcss';
import MagicString from 'magic-string';
import  * as sass from 'sass';
import type { Plugin, ResolvedConfig } from 'vite';

import { type PluginAsyncFnReturn, type PluginParams, type PluginSyncFnReturn, VitePlugin, vitePluginClassToPlugin } from './vite-plugin.ts';


const traverse = (_traverse as unknown as { default: typeof _traverse; }).default;


export const transformSass = (options?: {
	rootDir?:    string;
	debugLevel?: 'error' | 'silent';
}): Plugin => {
	const { rootDir = '', debugLevel = 'silent' } = options || {};

	return vitePluginClassToPlugin(
		new SassTransformer(rootDir, debugLevel, false),
	);
};


class SassTransformer implements VitePlugin {

	constructor(
		readonly rootDir: string,
		readonly debugLevel: 'error' | 'silent',
		readonly minify: boolean,
	) { }

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
							const path = pathToFileURL(join(this.resolvedConfig.root, this.rootDir));
							const newUrl = new URL(url, path + '/');

							return newUrl;
						},
					},
				],
			}).css;
		}
		catch (err) {
			if (this.debugLevel !== 'silent') {
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
			if (this.debugLevel !== 'silent') {
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

		if (this.minify) {
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

		const ast = parser.parse(code, {
			sourceType: 'module',
			plugins:    [ 'importAttributes', 'typescript', 'decorators-legacy' ],
		});

		const replacements: { from: string; to: string; }[] = [];

		traverse(ast, {
			TemplateLiteral: (path) => {
				if (path.parent.type !== 'TaggedTemplateExpression')
					return;
				if (path.parent.tag.type !== 'Identifier')
					return;

				const identifier = path.parent.tag.loc?.identifierName ?? '';
				if (!this.identifierNames.includes(identifier))
					return;

				const start = path.node.start! + 1;
				const end = path.node.end! - 1;

				const text = code.slice(start, end);
				if (!text)
					return;

				let compiled = this.fromSASSToCSS(text);
				if (!compiled)
					return;

				if (this.minify) {
					compiled = this.minifyCSS(compiled, id);
					if (!compiled)
						return;
				}

				// we cannot mutate the code string while traversing.
				// so we gather the text changes that need to be done.
				// we push the latest changes to the beginning of the array
				// so that as we apply the changes, the indexes are still valid.
				replacements.unshift({ from: text, to: compiled });
			},
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
			if (this.debugLevel !== 'silent') {
				console.error('\nFailed to apply sass transformation and minification: ' + id);
				console.error(err);
			}
		}
	}
	//#endregion Plugin Hooks

}
