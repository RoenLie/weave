/* eslint-disable @stylistic/max-len */

import * as babel from '@babel/core';
import { mergeAndConcat } from 'merge-anything';
import { describe, test } from 'vitest';

import { litJsxBabelPreset } from '../../src/compiler/babel-preset.ts';

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

		let expected = `import { html } from "lit-html";`;
		expected += `\nconst template = html\`\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;

		expect(code).to.be.eq(expected);
	});

	test('should transform a single JSX element', async ({ expect }) => {
		const source = `
		const template = <div class="test">Hello World</div>;
		`;

		let expected = `import { html } from "lit-html";`;
		expected += `\nconst template = html\`<div class="test">Hello World</div>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;

		expect(code).to.be.eq(expected);
	});

	test('should transform a custom element Component', async ({ expect }) => {
		const source = `
		import { SpecialElement_ } from './special-element.ts';
		const template = <SpecialElement_ name="kakemann" />;
		`;
		let expected = `import { html as htmlStatic } from "lit-html/static.js";`;
		expected += `\nimport { __$literalMap } from "jsx-lit";`;
		expected += `\nimport { SpecialElement_ } from './special-element.ts';`;
		expected += `\nconst __$SpecialElement_ = __$literalMap.get(SpecialElement_);`;
		expected += `\nconst template = htmlStatic\`<\${__$SpecialElement_} name="kakemann"></\${__$SpecialElement_}>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;
		expect(code).to.be.eq(expected);
	});

	test('should transform an element with attributes', async ({ expect }) => {
		const source = `
		const template = <>
			<div
				static-attribute="value1"
				dynamic-attribute={dynamicValue}
				boolean={asBool(true)}
				property={asProp('value2')}
				{...asDire(ifDefined('value3'))}
			>
				Hello World
			</div>
		</>;
		`;
		let expected = `import { html } from "lit-html";`;
		expected += `\nconst template = html\``;
		expected += `<div static-attribute="value1"`;
		expected += ` dynamic-attribute=\${dynamicValue}`;
		expected += ` ?boolean=\${true}`;
		expected += ` .property=\${'value2'}`;
		expected += ` \${ifDefined('value3')}`;
		expected += `>Hello World</div>\`;`;


		const result = await babel.transformAsync(source, opts);
		const code = result?.code;
		expect(code).to.be.eq(expected);
	});

	test('should handle spread attributes', async ({ expect }) => {
		const source = `
		import { SpecialElement_ } from './special-element.ts';
		const template = (
			<SpecialElement_
				name="kakemann"
				{...{
					foo: 'bar',
					baz: 'qux',
				}}
			/>
		);
		`;

		const expected = `import { html as htmlStatic } from "lit-html/static.js";
import { __$rest } from "jsx-lit";
import { __$literalMap } from "jsx-lit";
import { SpecialElement_ } from './special-element.ts';
const __$SpecialElement_ = __$literalMap.get(SpecialElement_);
const template = htmlStatic\`<\${__$SpecialElement_} name="kakemann" \${__$rest({
  foo: 'bar',
  baz: 'qux'
})}></\${__$SpecialElement_}>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;

		expect(code).to.be.eq(expected);
	});

	test('should add svg template', async ({ expect }) => {
		const source = `
		const template = (
			<circle />
		);
		`;

		let expected = `import { svg } from "lit-html/directives/svg.js";`;
		expected += `\nconst template = svg\`<circle></circle>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;

		expect(code).to.be.eq(expected);
	});

	test('should not add svg template', async ({ expect }) => {
		const source = `
		const template = (
			<svg>
				<circle />
			</svg>
		);
		`;

		let expected = `import { html } from "lit-html";`;
		expected += `\nconst template = html\`<svg><circle></circle></svg>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;

		expect(code).to.be.eq(expected);
	});

	test('should add mathml template', async ({ expect }) => {
		const source = `
		const template = (
			<mrow>
				<mi>x</mi>
				<mo>+</mo>
				<mi>y</mi>
			</mrow>
		);
		`;

		let expected = `import { mathml } from "lit-html/directives/mathml.js";`;
		expected += `\nconst template = mathml\`<mrow><mi>x</mi><mo>+</mo><mi>y</mi></mrow>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;

		expect(code).to.be.eq(expected);
	});

	test('should not add mathml template', async ({ expect }) => {
		const source = `
		const template = (
			<math>
				<mrow>
					<mi>x</mi>
				</mrow>
			</math>
		);
		`;

		let expected = `import { html } from "lit-html";`;
		expected += `\nconst template = html\`<math><mrow><mi>x</mi></mrow></math>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;

		expect(code).to.be.eq(expected);
	});

	test('should handle boolean assignment', async ({ expect }) => {
		const source = `
		const isActive = true;
		const template = (
			<div active={asBool(isActive)}>
				Hello World
			</div>
		);
		`;
		let expected = `import { html } from "lit-html";`;
		expected += `\nconst isActive = true;`;
		expected += `\nconst template = html\`<div ?active=\${isActive}>Hello World</div>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;

		expect(code).to.be.eq(expected);
	});

	test('should handle attribute assignment', async ({ expect }) => {
		const source = `
		const value = 'test';
		const template = (
			<div key={asAttr(value)}>
				Hello World
			</div>
		);
		`;
		let expected = `import { html } from "lit-html";`;
		expected += `\nconst value = 'test';`;
		expected += `\nconst template = html\`<div key=\${value}>Hello World</div>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;

		expect(code).to.be.eq(expected);
	});
});
