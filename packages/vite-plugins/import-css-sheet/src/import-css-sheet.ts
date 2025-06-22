import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

import { transform } from 'lightningcss';
import type { CustomPluginOptions, PluginContext } from 'rollup';
import type { ResolvedConfig } from 'vite';


export class ImportCSSSheet {

	constructor(
		public config: ResolvedConfig,
		public transformers: ((code: string, id: string) => string)[],
		public additionalCode: string[],
		public minify: boolean,
	) {}

	filetypes = new Set([ '.ts', '.mts', '.js', '.mjs' ]);
	virtualModules:   Map<string, string> = new Map();
	charReplacements: Map<string, string> = new Map([
		[ '\\', '\\\\' ],
		[ '`', '\\`' ],
		[ '$', '\\$' ],
	]);

	totalBeforeMinify = 0;
	totalAfterMinify = 0;

	convert(str: string): string {
		let res = '';
		for (const c of str)
			res += this.charReplacements.get(c) || c;

		return `\`${ res }\``;
	}

	cssImportAssertRegex(str: string): RegExp {
		return new RegExp(str + `['"] *(?:with|assert) *{ *type: *['"]css['"]`);
	}

	async resolveId(
		context: PluginContext,
		source: string,
		importer: string | undefined,
		options: {
			attributes: Record<string, string>;
			custom?:    CustomPluginOptions | undefined;
			ssr?:       boolean | undefined;
			isEntry:    boolean;
		},
	): Promise<string | undefined> {
		if (!source.endsWith('.css') || !importer)
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

		const importerContent = await readFile(importer!, { encoding: 'utf8' });
		const regexp = this.cssImportAssertRegex(source);

		if (regexp.test(importerContent)) {
			const modId = '\0virtual:' + source.replace('.css', '.stylesheet');
			this.virtualModules.set(modId, resolvedId);

			return modId;
		}
	}

	async load(
		context: PluginContext,
		id: string,
		_options?: {
			ssr?: boolean | undefined;
		},
	): Promise<string | undefined> {
		if (!this.virtualModules.has(id))
			return;

		const realId = this.virtualModules.get(id)!;

		let fileContent = await readFile(realId, { encoding: 'utf8' });
		context.addWatchFile(realId);

		for (const transform of this.transformers)
			fileContent = transform(fileContent, realId);

		if (this.minify) {
			try {
				if (this.config.mode !== 'development')
					this.totalBeforeMinify += fileContent.length;

				const { code } = transform({
					code:     Buffer.from(fileContent),
					filename: realId,
					minify:   true,
				});

				const decoder = new TextDecoder();
				fileContent = decoder.decode(code);

				if (this.config.mode !== 'development')
					this.totalAfterMinify += fileContent.length;
			}
			catch (err) {
				console.error('Failed to minify css sheet');
				console.error(err);
			}
		}

		const createCode =
		`const styles = ${ this.convert(fileContent) }`
		+ `\n${ this.additionalCode.join('\n') }`
		+ '\nconst sheet = new CSSStyleSheet();'
		+ '\nsheet.replaceSync(styles);'
		+ '\nexport default sheet;';

		return createCode;
	}

}
