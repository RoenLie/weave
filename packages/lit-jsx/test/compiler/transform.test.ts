/* eslint-disable @stylistic/max-len */

import * as babel from '@babel/core';
import { describe, test } from 'vitest';

import { litJsxBabelPreset } from '../../src/compiler/babel-preset.ts';
import { isJSXElementStatic } from '../../src/compiler/transform-jsx.ts';


type BabelPlugins = NonNullable<NonNullable<babel.TransformOptions['parserOpts']>['plugins']>;


describe('Transform JSX', () => {
	const opts: babel.TransformOptions = {
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
	};

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

	test('should transform a polymorphic JSX element', async ({ expect }) => {
		const source = `
		const Tag = toTag(this.href ? 'a' : 'div');

		const template = <Tag.tag href="https://example.com">Click me</Tag.tag>;
		`;

		const expected = ''
		+ `import { html as htmlStatic } from "lit-html/static.js";`
		+ `\nimport { __$literalMap } from "jsx-lit";`
		+ `\nconst Tag = toTag(this.href ? 'a' : 'div');`
		+ `\nconst __$Tag = __$literalMap.get(Tag.tag);`
		+ `\nconst template = htmlStatic\`<\${__$Tag} href="https://example.com">Click me</\${__$Tag}>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;
		expect(code).to.be.eq(expected);
	});

	test('should transform a custom element Component', async ({ expect }) => {
		const source = `
		import { SpecialElement } from './special-element.ts';
		const template = <SpecialElement.tag name="kakemann" />;
		`;
		const expected = ''
		+ `import { html as htmlStatic } from "lit-html/static.js";`
		+ `\nimport { __$literalMap } from "jsx-lit";`
		+ `\nimport { SpecialElement } from './special-element.ts';`
		+ `\nconst __$SpecialElement = __$literalMap.get(SpecialElement.tag);`
		+ `\nconst template = htmlStatic\`<\${__$SpecialElement} name="kakemann"></\${__$SpecialElement}>\`;`;

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
				boolean={bool => true}
				property={prop => 'value2'}
				directive={ifDefined('value3')}
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
		import { SpecialElement } from './special-element.ts';
		const template = (
			<SpecialElement.tag
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
import { SpecialElement } from './special-element.ts';
const __$SpecialElement = __$literalMap.get(SpecialElement.tag);
const template = htmlStatic\`<\${__$SpecialElement} name="kakemann" \${__$rest({
  foo: 'bar',
  baz: 'qux'
})}></\${__$SpecialElement}>\`;`;

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

	test('should handle boolean callExpression assignment', async ({ expect }) => {
		const source = `
		const isActive = true;
		const template = (
			<div active={as.bool(isActive)}>
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

	test('should handle boolean arrow function assignment', async ({ expect }) => {
		const source = `
		const isActive = true;
		const template = (
			<div active={bool => isActive}>
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

	test('should handle prop callExpression assignment', async ({ expect }) => {
		const source = `
		const isActive = true;
		const template = (
			<div active={as.prop(isActive)}>
				Hello World
			</div>
		);
		`;
		let expected = `import { html } from "lit-html";`;
		expected += `\nconst isActive = true;`;
		expected += `\nconst template = html\`<div .active=\${isActive}>Hello World</div>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;

		expect(code).to.be.eq(expected);
	});

	test('should handle prop arrow function assignment', async ({ expect }) => {
		const source = `
		const isActive = true;
		const template = (
			<div active={prop => isActive}>
				Hello World
			</div>
		);
		`;
		let expected = `import { html } from "lit-html";`;
		expected += `\nconst isActive = true;`;
		expected += `\nconst template = html\`<div .active=\${isActive}>Hello World</div>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;

		expect(code).to.be.eq(expected);
	});

	test('should handle attribute assignment', async ({ expect }) => {
		const source = `
		const value = 'test';
		const template = (
			<div key={value}>
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

	test('should handle a single element directive', async ({ expect }) => {
		const source = `
		<div directive={myDirective()} />
		`;

		const expected = `import { html } from "lit-html";`
		+ `\nhtml\`<div \${myDirective()}></div>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;
		expect(code).to.be.eq(expected);
	});

	test('should handle an array of element directives', async ({ expect }) => {
		const source = `
		<div directive={[myDirective()]} />
		`;

		const expected = `import { html } from "lit-html";`
		+ `\nhtml\`<div \${myDirective()}></div>\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;
		expect(code).to.be.eq(expected);
	});

	test('should correct convert a Component function', async ({ expect }) => {
		const source = `
		const obj = {each: this.items};
		<div>
			<For
				{...{obj}}
				each={this.items}
				key={item => item}
				separator={<hr />}
			>
			{item => <div>{item}</div>}
			</For>
		</div>
		`;

		const expected = ''
		+ `import { html } from "lit-html";`
		+ '\nconst obj = {'
		+ '\n  each: this.items'
		+ '\n};'
		+ '\nhtml`<div>${For({'
		+ '\n  ...{'
		+ '\n    obj'
		+ '\n  },'
		+ '\n  each: this.items,'
		+ '\n  key: item => item,'
		+ '\n  separator: html`<hr></hr>`,'
		+ '\n  children: item => html`<div>${item}</div>`'
		+ '\n})}</div>`;';

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;
		expect(code).to.be.eq(expected);
	});

	test('should handle function component with multiple JSX children', async ({ expect }) => {
		const source = `
		<MyComponent prop1="value" prop2={expression}>
			<div>First child</div>
			{someExpression}
			<span>Second child</span>
			Text content
		</MyComponent>
		`;

		const expected = ''
		+ `import { html } from "lit-html";`
		+ '\nhtml`${MyComponent({'
		+ '\n  prop1: "value",'
		+ '\n  prop2: expression,'
		+ '\n  children: [html`<div>First child</div>`, someExpression, html`<span>Second child</span>`, "Text content"]'
		+ '\n})}`;';

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;
		expect(code).to.be.eq(expected);
	});

	test('should handle function component with single JSX child', async ({ expect }) => {
		const source = `
		<MyComponent>
			<div>Single child</div>
		</MyComponent>
		`;

		const expected = ''
		+ `import { html } from "lit-html";`
		+ '\nhtml`${MyComponent({'
		+ '\n  children: html`<div>Single child</div>`'
		+ '\n})}`;';

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;
		expect(code).to.be.eq(expected);
	});

	test('should handle function component with no children', async ({ expect }) => {
		const source = `
		<MyComponent prop1="value" />
		`;

		const expected = ''
		+ `import { html } from "lit-html";`
		+ '\nhtml`${MyComponent({'
		+ '\n  prop1: "value"'
		+ '\n})}`;';

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;
		expect(code).to.be.eq(expected);
	});

	test('should handle a template, with an expression using a fragment', async ({ expect }) => {
		const source = `
		const template = (
			<>
				{() => <>
				 	<div>First</div>
				</>}
			</>
		);
		`;

		const expected = ''
		+ `import { html } from "lit-html";`
		+ `\nconst template = html\`\${() => html\`<div>First</div>\`}\`;`;

		const result = await babel.transformAsync(source, opts);
		const code = result?.code;
		expect(code).to.be.eq(expected);
	});
});


describe('isJSXElementStatic', () => {
	const testStaticDetection = async (source: string): Promise<boolean> => {
		let testResult = false;

		const visitor = (path: any) => {
			// Only test root JSX nodes (not nested ones)
			const isRoot = !path.parent
				|| (!babel.types.isJSXElement(path.parent)
				&& !babel.types.isJSXFragment(path.parent));

			if (isRoot) {
				console.time('isJSXElementStatic');
				testResult = isJSXElementStatic(path);
				console.timeEnd('isJSXElementStatic');
			}
		};

		const opts: babel.TransformOptions = {
			root:           '.',
			filename:       'test.tsx',
			sourceFileName: 'test.tsx',
			presets:        [],
			plugins:        [
				{
					visitor: {
						JSXElement:  visitor,
						JSXFragment: visitor,
					},
				},
			],
			ast:        false,
			sourceMaps: true,
			configFile: false,
			babelrc:    false,
			parserOpts: {
				plugins: [ 'jsx', 'typescript' ] satisfies BabelPlugins,
			},
		};

		await babel.transformAsync(source, opts);

		return testResult;
	};

	test('should return true for templates with custom element components (.tag)', async ({ expect }) => {
		const source = `
		const template = (
			<div>
				<SpecialElement.tag name="test">
					<span>Nested content</span>
					{someExpression}
				</SpecialElement.tag>
				<regular-element>Regular HTML</regular-element>
			</div>
		);
		`;

		const result = await testStaticDetection(source);
		expect(result).toBe(true);
	});

	test('should return false for templates without custom element components', async ({ expect }) => {
		const source = `
		const template = (
			<div className="container">
				<span>Regular content</span>
				<button onClick={handleClick}>Click me</button>
				{conditionalContent && <p>Conditional</p>}
				<For each={items}>
					{item => <li>{item}</li>}
				</For>
			</div>
		);
		`;

		const result = await testStaticDetection(source);
		expect(result).toBe(false);
	});

	test('should return true for fragments containing custom element components', async ({ expect }) => {
		const source = `
		const template = (
			<>
				<div>Regular div</div>
				<CustomComponent.tag prop="value">
					<nested-element>
						<AnotherCustom.tag />
					</nested-element>
				</CustomComponent.tag>
				<span>Another regular element</span>
			</>
		);
		`;

		const result = await testStaticDetection(source);
		expect(result).toBe(true);
	});

	test('should return false for empty fragments', async ({ expect }) => {
		const source = `
		const template = <></>;
		`;

		const result = await testStaticDetection(source);
		expect(result).toBe(false);
	});

	test('should return true for deeply nested custom elements', async ({ expect }) => {
		const source = `
		const template = (
			<div>
				<section>
					<article>
						<header>
							<Title.tag level={2}>
								<Icon.tag name="star" />
								Dynamic Title
							</Title.tag>
						</header>
						<main>
							<p>Regular content</p>
							<ComponentFunction prop="value">
								<span>Function component child</span>
							</ComponentFunction>
						</main>
					</article>
				</section>
			</div>
		);
		`;

		const result = await testStaticDetection(source);
		expect(result).toBe(true);
	});

	test('should return false for templates with only function components', async ({ expect }) => {
		const source = `
		const template = (
			<div>
				<MyComponent prop="value">
					<ChildComponent>
						<span>Nested</span>
					</ChildComponent>
				</MyComponent>
				<AnotherComponent />
			</div>
		);
		`;

		const result = await testStaticDetection(source);
		expect(result).toBe(false);
	});
});
