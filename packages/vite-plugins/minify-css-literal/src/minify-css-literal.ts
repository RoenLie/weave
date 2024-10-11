import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
import { transform } from 'lightningcss';
import MagicString from 'magic-string';
import type { Plugin, ResolvedConfig } from 'vite';

const traverse = (_traverse as unknown as { default: typeof _traverse }).default;


export const minifyCssLiteral = (debugLevel: 'error' | 'silent' = 'silent'): Plugin => {
	let config: ResolvedConfig;
	const fileExt = [ '.ts', '.js' ];
	const identifierNames = [ 'css' ];
	const decoder = new TextDecoder();

	let totalBeforeMinify = 0;
	let totalAfterMinify = 0;

	return {
		name: '@roenlie/vite-plugin-minify-css-literal',
		configResolved(cfg) {
			config = cfg;
		},
		transform(code, id, _options) {
			if (config.mode === 'development')
				return;
			if (!fileExt.some(e => id.endsWith(e)))
				return;
			if (!identifierNames.some(name => code.includes(name)))
				return;

			const ast = parser.parse(code, {
				sourceType: 'module',
				plugins:    [ 'importAttributes', 'typescript', 'decorators-legacy' ],
			});

			const replacements: { from: string; to: string; }[] = [];

			traverse(ast, {
				TemplateLiteral(path) {
					if (path.parent.type !== 'TaggedTemplateExpression')
						return;
					if (path.parent.tag.type !== 'Identifier')
						return;

					const identifier = path.parent.tag.loc?.identifierName ?? '';
					if (!identifierNames.includes(identifier))
						return;

					const start = path.node.start! + 1;
					const end = path.node.end! - 1;

					const text = code.slice(start, end);
					if (!text)
						return;

					try {
						const { code: output } = transform({
							code:     Buffer.from(text),
							filename: id,
							minify:   true,
						});
						const minified = decoder.decode(output);

						if (config.mode !== 'development') {
							totalBeforeMinify += text.length;
							totalAfterMinify += minified.length;
						}

						// we cannot mutate the code string while traversing.
						// so we gather the text changes that need to be done.
						// we push the latest changes to the beginning of the array
						// so that as we apply the changes, the indexes are still valid.
						replacements.unshift({ from: text, to: minified });
					}
					catch (err) {
						if (debugLevel !== 'silent') {
							console.error('Failed to minify css literal');
							console.error(err);
						}
					}
				},
			});

			if (!replacements.length)
				return;

			try {
				const str = new MagicString(code);
				replacements.forEach(({ from, to }) => str.replace(from, to));

				return {
					code: str.toString(),
					map:  str.generateMap({ file: id }),
				};
			}
			catch (err) {
				if (debugLevel !== 'silent') {
					console.error('\nFailed to apply css literal minification: ' + id);
					console.error(err);
				}
			}
		},
		buildEnd() {
			if (config.mode === 'development')
				return;

			console.log('\n@roenlie/vite-plugin-minify-css-literal');
			console.log('Minified css literals by', totalBeforeMinify - totalAfterMinify, 'characters.');
			console.log('Before minify:', totalBeforeMinify, '.\nAfter minify:', totalAfterMinify);
		},
	};
};
