import type { Plugin } from 'vite';
import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
import { transform } from 'lightningcss';

const traverse = (_traverse as unknown as { default: typeof _traverse }).default;


export const minifyCssLiteral = (): Plugin => {
	const fileExt = [ '.ts', '.js' ];
	const identifierNames = [ 'css' ];
	const decoder = new TextDecoder();

	return {
		name: '@roenlie/vite-plugin-minify-css-literal',
		transform(code, id, _options) {
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

					try {
						const { code: output } = transform({
							code:     Buffer.from(text),
							filename: id,
							minify:   true,
						});
						const minified = decoder.decode(output);

						// we cannot mutate the code string while traversing.
						// so we gather the text changes that need to be done.
						replacements.push({ from: text, to: minified });
					}
					finally { /*  */ }
				},
			});

			replacements.forEach(({ from, to }) => code = code.replace(from, to));

			return code;
		},
	};
};
