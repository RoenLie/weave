/* eslint-disable @stylistic/max-len */

import * as babel from '@babel/core';
import { mergeAndConcat } from 'merge-anything';
import { describe, test } from 'vitest';

import { litJsxBabelPreset2 } from '../../src/compiler/babel-preset.ts';

type BabelPlugins = NonNullable<NonNullable<babel.TransformOptions['parserOpts']>['plugins']>;
const plugins: BabelPlugins = [ 'jsx', 'typescript' ];

// Default value for babel user options
const babelUserOptions: babel.TransformOptions = {};

const babelOptions: babel.TransformOptions = {
	root:           '.',
	filename:       'test.tsx',
	sourceFileName: 'test.tsx',
	presets:        [
		[
			litJsxBabelPreset2,
			/* merged into the metadata obj through state.opts */
			{},
		],
	],
	plugins:    [],
	ast:        false,
	sourceMaps: true,
	configFile: false,
	babelrc:    false,
	parserOpts: {
		plugins,
	},
};

const opts = mergeAndConcat(babelUserOptions, babelOptions);


describe('Transform JSX', (context) => {
	test('should transform a div with a single child expression', async ({ expect }) => {
		const source = `
		const name = 'World';
		const sayHello = (name: string) => <div>Hello {name}</div>;
		`;

		const expected = ``
		+ `import { __$t } from "jsx-lit";`
		+ `\nconst name = 'World';`
		+ `\nconst sayHello = (name: string) => ({`
		+ `\n  "_$litType$": {`
		+ `\n    "h": __$t\`<div>Hello<?></div>\`,`
		+ `\n    "parts": [{`
		+ `\n      "type": 2,`
		+ `\n      "index": 1`
		+ `\n    }]`
		+ `\n  },`
		+ `\n  "values": [name]`
		+ `\n});`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;

		expect(code).to.be.eq(expected);
	});

	test('should transform a nested div with an expression in each child', async ({ expect }) => {
		const source = `
		const name = 'World';
		const sayHello = (name: string) => (
			<div>
				Hello {name}
				<span>Goodbye {name}</span>
			</div>
		);
		`;

		const expected = ``
		+ `import { __$t } from "jsx-lit";`
		+ `\nconst name = 'World';`
		+ `\nconst sayHello = (name: string) => ({`
		+ `\n  "_$litType$": {`
		+ `\n    "h": __$t\`<div>Hello<?><span>Goodbye<?></span></div>\`,`
		+ `\n    "parts": [{`
		+ `\n      "type": 2,`
		+ `\n      "index": 1`
		+ `\n    }, {`
		+ `\n      "type": 2,`
		+ `\n      "index": 2`
		+ `\n    }]`
		+ `\n  },`
		+ `\n  "values": [name, name]`
		+ `\n});`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;

		expect(code).to.be.eq(expected);
	});
});
