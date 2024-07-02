import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

import type { CustomPluginOptions, PluginContext } from 'rollup';
import type { ResolvedConfig } from 'vite';


export class ImportCSSSheet {

	public filetypes = new Set([ '.ts', '.mts', '.js', '.mjs' ]);
	public virtualModules = new Map<string, string>();
	public charReplacements = new Map<string, string>([
		[ '\\', '\\\\' ],
		[ '`', '\\`' ],
		[ '$', '\\$' ],
	]);

	constructor(
		public config: ResolvedConfig,
		public transformers: ((code: string, id: string) => string)[],
		public additionalCode: string[],
	) {}

	public convert(str: string) {
		let res = '';
		for (const c of str)
			res += this.charReplacements.get(c) || c;

		return `\`${ res }\``;
	}

	public cssImportAssertRegex(str: string) {
		return new RegExp(str + `['"] *(?:with|assert) *{ *type: *['"]css['"]`);
	}

	public async resolveId(
		context: PluginContext,
		source: string,
		importer: string | undefined,
		options: {
			attributes: Record<string, string>;
			custom?: CustomPluginOptions | undefined;
			ssr?: boolean | undefined;
			isEntry: boolean;
		},
	) {
		if (!source.endsWith('.css') || !importer)
			return;

		const ext = extname(importer);
		if (!this.filetypes.has(ext))
			return;

		const resolvedId = (await context.resolve(source, importer, options))?.id;
		if (!resolvedId)
			return;

		const importerContent = await readFile(importer!, { encoding: 'utf8' });
		const regxp = this.cssImportAssertRegex(source);

		if (regxp.test(importerContent)) {
			const modId = '\0virtual:' + source.replace('.css', '.stylesheet');
			this.virtualModules.set(modId, resolvedId);

			return modId;
		}
	}

	public async load(
		context: PluginContext,
		id: string,
		_options?: {
			ssr?: boolean | undefined;
		},
	) {
		if (!this.virtualModules.has(id))
			return;

		const realId = this.virtualModules.get(id)!;

		let fileContent = await readFile(realId, { encoding: 'utf8' });
		context.addWatchFile(realId);

		for (const transform of this.transformers)
			fileContent = transform(fileContent, realId);

		const createCode =
		`const styles = ${ this.convert(fileContent) }`
		+ `\n${ this.additionalCode.join('\n') }`
		+ '\nconst sheet = new CSSStyleSheet();'
		+ '\nsheet.replaceSync(styles);'
		+ '\nexport default sheet;';

		return createCode;
	}

}
