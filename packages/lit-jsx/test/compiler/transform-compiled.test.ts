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
	test('should transform a div', async ({ expect }) => {
		const source = `
		const sayHello = (name: string) => <h1>Hello {name}{'!'}</h1>;
		`;

		let expected = `import { html } from "lit-html";`;
		expected += `\nconst template = html\`\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;

		console.log(code);


		//expect(code).to.be.eq(expected);
	});
});
