import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

import { isElementNode, isParentNode } from '@parse5/tools';
import { type DefaultTreeAdapterMap, parse } from 'parse5';
import type { PluginOption } from 'vite';


interface Options {
	exportIds?: boolean;
}


/**
 * Transforms HTML files to support the HTML modules proposal, which enables
 * importing HTML into JavaScript modules.
 *
 * This plugin enables HTML module support in Vite by transforming HTML files
 * that are imported with a `{type: 'html'}` attribute into JavaScript modules
 * that export DOM nodes.
 */
export const htmlModules = (options?: Options): PluginOption => {
	const virtualModules: Map<string, string> = new Map();
	const validImporter = [ '.ts', '.mts', '.js', '.mjs' ] as const;
	const illegalChars: Record<string, string> = {
		'\\': '\\\\', // Preserve any escape sequences in the source:
		'`':  '\\`',  // Escape backticks:
		'$':  '\\$',  // Escape ${} interpolation:
	};

	const importAssertRegex = (str: string, type: string) =>
		new RegExp(str + `['"] *(?:with|assert) *{[(?:\r?\n) \t]*type: *['"]${ type }['"][(?:\r?\n) ]*};`);

	const convert = (str: string) => {
		let res = '';
		for (const c of str)
			res += illegalChars[c] || c;

		return `\`${ res }\``;
	};

	return {
		enforce: 'pre',
		name:    'vite-plugin-html-modules',
		async resolveId(source, importer) {
			if (!source.endsWith('.html'))
				return;
			if (!validImporter.some(ext => importer?.endsWith(ext)))
				return;

			const resolvedId = await this.resolve(source, importer);
			importer = importer!.split('?')[0]!;

			if (resolvedId) {
				const importerContent = await readFile(importer, { encoding: 'utf8' });

				if (importAssertRegex(source, 'html').test(importerContent)) {
					const modId = '\0virtual:' + basename(source) + '.js';
					virtualModules.set(modId, resolvedId.id);

					return modId;
				}
			}
		},
		async load(id) {
			const realId = virtualModules.get(id);
			if (!realId)
				return;

			this.addWatchFile(realId);

			const code = await readFile(realId, { encoding: 'utf8' });

			const elementExports: string[] = [];

			if (options?.exportIds ?? false) {
				const ast = parse(code);

				// Walk the parse5 AST to find all elements with id attributes.
				const exportedIds: Set<string> = new Set();

				(function traverse(node: DefaultTreeAdapterMap['node']) {
					if (isElementNode(node)) {
						const idAttr = node.attrs.find((attr: any) => attr.name === 'id');
						if (idAttr !== undefined)
							exportedIds.add(idAttr.value);
					}

					if (isParentNode(node)) {
						for (const childNode of node.childNodes)
							traverse(childNode);
					}
				})(ast);

				const idArr = [ ...exportedIds ];
				for (let i = 0; i < idArr.length; i++) {
					const id = idArr[i]!;

					elementExports.push(
						isValidExportName(id)
							? `export const ${ id } = doc.querySelector('#${ id }');\n`
							: `const export${ i } = doc.querySelector('#${ id }');\n`
							+ `export { export${ i } as '${ id }' };\n`,
					);
				}
			}

			// Escape the HTML source so that it can be used in a template literal.
			const escapedCode = convert(code);

			return ''
			+ 'const parser = new DOMParser();\n'
			+ `const doc = parser.parseFromString(${ escapedCode }, 'text/html');\n`
			+ `export default doc;\n`
			+ elementExports.join('');
		},
	};
};


const isValidExportName = (name: string) => {
	return /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name);
};
