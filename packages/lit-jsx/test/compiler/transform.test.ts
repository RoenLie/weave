/* eslint-disable @stylistic/max-len */

import * as babel from '@babel/core';
import { mergeAndConcat } from 'merge-anything';
import { describe, test } from 'vitest';

import { litJsxBabelPreset } from '../../src/compiler/lit-jsx-babel-preset.ts';


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
			litJsxBabelPreset,
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
	test('should transform an empty JSX fragment', async ({ expect }) => {
		const source = `
		const template = <></>;
		`;

		const expected = `import { html } from "lit-html";
const template = html\`\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;
		console.log(code);

		expect(code).to.be.eq(expected);
	});


	test('should transform a single JSX element', async ({ expect }) => {
		const source = `
		const template = <div class="test">Hello World</div>;
		`;

		const expected = `import { html } from "lit-html";
const template = html\`<div class="test">Hello World</div>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;
		console.log(code);

		expect(code).to.be.eq(expected);
	});


	test('should transform JSX code', async ({ expect }) => {
		const source = `
		import { SpecialElement } from './special-element.ts';
		const basicTemplate = <>
			<div
				class="1"
				value1={'first-value'}
				value2={'second-value'}
				on-click={() => console.log('clicked')}
			>
				<span>{
				when(true, () => <s-inner-span></s-inner-span>)
				}</span>
			</div>
			<div class="2" />
		</>

		const template = (<>
			<SpecialElement name="kakemann">
				<SpecialElement name="kakemann">
				</SpecialElement>
			</SpecialElement>
		</>);
		`;

		const expected = `import { unsafeStatic } from "lit-html/static.js";
import { html as htmlStatic } from "lit-html/static.js";
import { __$literalMap } from "@roenlie/lit-jsx/utils";
import { html } from "lit-html";
import { SpecialElement } from './special-element.ts';
const __$SpecialElement = __$literalMap.get(SpecialElement);
const basicTemplate = html\`<div class="1" .value1=\${'first-value'} .value2=\${'second-value'} @click=\${() => console.log('clicked')}><span>\${when(true, () => html\`<s-inner-span></s-inner-span>\`)}</span></div><div class="2"></div>\`;
const template = htmlStatic\`<\${__$SpecialElement} name="kakemann"><\${__$SpecialElement} name="kakemann"></\${__$SpecialElement}></\${__$SpecialElement}>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;
		console.log(code);

		expect(code).to.be.eq(expected);
	});
	test('should handle spread attributes', async ({ expect }) => {
		const source = `
		import { SpecialElement } from './special-element.ts';
		const template = (
			<SpecialElement
				name="kakemann"
				{...{
					foo: 'bar',
					baz: 'qux',
				}}
			/>
		);
		`;

		const expected = `import { unsafeStatic } from "lit-html/static.js";
import { html as htmlStatic } from "lit-html/static.js";
import { __$rest } from "@roenlie/lit-jsx/utils";
import { __$literalMap } from "@roenlie/lit-jsx/utils";
import { SpecialElement } from './special-element.ts';
const __$SpecialElement = __$literalMap.get(SpecialElement);
const template = htmlStatic\`<\${__$SpecialElement} name="kakemann" \${__$rest({
  foo: 'bar',
  baz: 'qux'
})}></\${__$SpecialElement}>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;
		console.log(code);

		expect(code).to.be.eq(expected);
	});
});
