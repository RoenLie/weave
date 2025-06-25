/* eslint-disable @stylistic/max-len */

import * as babel from '@babel/core';
import { describe, test } from 'vitest';

import { litJsxBabelPreset } from '../../src/compiler/babel-preset.ts';


type BabelPlugins = NonNullable<NonNullable<babel.TransformOptions['parserOpts']>['plugins']>;


describe('Transform JSX to a combination or standard and compiled lit-html', () => {
	const getOpts = (): babel.TransformOptions => ({
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
			plugins: [ 'jsx', 'typescript' ] satisfies BabelPlugins,
		},
	});

	test('transforms a single div to a compiled template', async ({ expect }) => {
		const source = `
		const template = <div>Hello</div>;
		`;

		const expected = ``
		+ `import { __$t } from "jsx-lit";`
		+ `\nconst _temp = {`
		+ `\n  "h": __$t\`<div>Hello</div>\`,`
		+ `\n  "parts": []`
		+ `\n};`
		+ `\nconst template = {`
		+ `\n  "_$litType$": _temp,`
		+ `\n  "values": []`
		+ `\n};`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;

		expect(code).to.be.eq(expected);
	});

	test('transforms a single dynamic tag to a standard template', async ({ expect }) => {
		const source = `
		const Hello = { tag: 'div' };
		const template = <Hello.tag>Hello</Hello.tag>;
		`;

		const expected = ``
		+ `import { html as htmlStatic } from "lit-html/static.js";`
		+ `\nimport { __$literalMap } from "jsx-lit";`
		+ `\nconst Hello = {`
		+ `\n  tag: 'div'`
		+ `\n};`
		+ `\nconst __$Hello = __$literalMap.get(Hello.tag);`
		+ `\nconst template = htmlStatic\`<\${__$Hello}>Hello</\${__$Hello}>\`;`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;

		expect(code).to.be.eq(expected);
	});

	test('transforms a root div into compiled, with a standard template in a child expression', async ({ expect }) => {
		const source = `
		const Hello = { tag: 'div' };
		const template = <div>
			{<Hello.tag>Hello</Hello.tag>}
		</div>;
		`;

		const expected = ``
		+ `import { html as htmlStatic } from "lit-html/static.js";`
		+ `\nimport { __$literalMap } from "jsx-lit";`
		+ `\nimport { __$t } from "jsx-lit";`
		+ `\nconst _temp = {`
		+ `\n  "h": __$t\`<div><?></div>\`,`
		+ `\n  "parts": [{`
		+ `\n    "type": 2,`
		+ `\n    "index": 1`
		+ `\n  }]`
		+ `\n};`
		+ `\nconst Hello = {`
		+ `\n  tag: 'div'`
		+ `\n};`
		+ `\nconst __$Hello = __$literalMap.get(Hello.tag);`
		+ `\nconst template = {`
		+ `\n  "_$litType$": _temp,`
		+ `\n  "values": [htmlStatic\`<\${__$Hello}>Hello</\${__$Hello}>\`]`
		+ `\n};`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;

		expect(code).to.be.eq(expected);
	});

	test('should handle function component with single JSX child', async ({ expect }) => {
		const source = `
		const template =
		<MyComponent>
			<div>Single child</div>
		</MyComponent>
		`;

		const expected = ''
		+ `const _temp = {`
		+ `\n  "h": __$t\`<div>Single child</div>\`,`
		+ `\n  "parts": []`
		+ `\n};`
		+ `\nconst template = MyComponent({`
		+ `\n  children: {`
		+ `\n    "_$litType$": _temp,`
		+ `\n    "values": []`
		+ `\n  }`
		+ `\n});`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		expect(code).to.be.eq(expected);
	});

	test('transforms a single dynamic tag to a standard template', async ({ expect }) => {
		const source = `
		const template = <For each={items}>
			{item => <div>{item}</div>}
		</For>;
		`;

		const expected = ``;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;

		console.log(code);

		expect(code).to.be.eq(expected);
	});
});
