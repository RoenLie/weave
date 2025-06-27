/* eslint-disable @stylistic/max-len */

import * as babel from '@babel/core';
import { describe, test } from 'vitest';

import { litJsxBabelPreset } from '../../src/compiler/babel-preset.ts';


type BabelPlugins = NonNullable<NonNullable<babel.TransformOptions['parserOpts']>['plugins']>;


describe('Comprehensive JSX to Lit Transpiler Tests', () => {
	const getOpts = (): babel.TransformOptions => ({
		root:           '.',
		filename:       'test.tsx',
		sourceFileName: 'test.tsx',
		presets:        [
			[
				litJsxBabelPreset,
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

	// ========== BASIC ELEMENT TESTS ==========

	test('transforms empty fragment', async ({ expect }) => {
		const source = `
		const template = <></>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Empty fragment:', code);
	});

	test('transforms div with static text content', async ({ expect }) => {
		const source = `
		const template = <div>Static text content</div>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Static text:', code);
	});

	test('transforms self-closing element', async ({ expect }) => {
		const source = `
		const template = <input type="text" />;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Self-closing:', code);
	});

	// ========== EXPRESSION TESTS ==========

	test('transforms element with single expression', async ({ expect }) => {
		const source = `
		const name = 'World';
		const template = <div>Hello {name}</div>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Single expression:', code);
	});

	test('transforms element with multiple expressions', async ({ expect }) => {
		const source = `
		const first = 'Hello';
		const second = 'World';
		const template = <div>{first} {second}</div>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Multiple expressions:', code);
	});

	test('transforms element with complex expression', async ({ expect }) => {
		const source = `
		const user = { name: 'John', age: 30 };
		const template = <div>User: {user.name} ({user.age} years old)</div>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Complex expression:', code);
	});

	test('transforms element with conditional expression', async ({ expect }) => {
		const source = `
		const isLoggedIn = true;
		const template = <div>{isLoggedIn ? 'Welcome' : 'Please log in'}</div>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Conditional expression:', code);
	});

	// ========== ATTRIBUTE TESTS ==========

	test('transforms element with static attributes', async ({ expect }) => {
		const source = `
		const template = <div class="container" id="main">Content</div>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Static attributes:', code);
	});

	test('transforms element with dynamic attribute', async ({ expect }) => {
		const source = `
		const className = 'dynamic-class';
		const template = <div class={className}>Content</div>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Dynamic attribute:', code);
	});

	test('transforms element with boolean attribute (arrow function)', async ({ expect }) => {
		const source = `
		const isDisabled = true;
		const template = <button disabled={bool => isDisabled}>Click me</button>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Boolean attribute (arrow):', code);
	});

	test('transforms element with boolean attribute (as.bool)', async ({ expect }) => {
		const source = `
		const isDisabled = true;
		const template = <button disabled={as.bool(isDisabled)}>Click me</button>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Boolean attribute (as.bool):', code);
	});

	test('transforms element with property assignment (arrow function)', async ({ expect }) => {
		const source = `
		const value = 'test-value';
		const template = <input value={prop => value} />;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Property assignment (arrow):', code);
	});

	test('transforms element with property assignment (as.prop)', async ({ expect }) => {
		const source = `
		const value = 'test-value';
		const template = <input value={as.prop(value)} />;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Property assignment (as.prop):', code);
	});

	test('transforms element with mixed attribute types', async ({ expect }) => {
		const source = `
		const className = 'dynamic';
		const isDisabled = true;
		const value = 'input-value';
		const template = (
			<input
				type="text"
				class={className}
				disabled={bool => isDisabled}
				value={prop => value}
			/>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Mixed attributes:', code);
	});

	// ========== CUSTOM ELEMENT TESTS (.tag) ==========

	test('transforms simple custom element', async ({ expect }) => {
		const source = `
		const Button = { tag: 'custom-button' };
		const template = <Button.tag>Click me</Button.tag>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Simple custom element:', code);
	});

	test('transforms custom element with attributes', async ({ expect }) => {
		const source = `
		const Button = { tag: 'custom-button' };
		const template = <Button.tag type="submit" variant="primary">Submit</Button.tag>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Custom element with attributes:', code);
	});

	test('transforms custom element with dynamic attributes', async ({ expect }) => {
		const source = `
		const Button = { tag: 'custom-button' };
		const variant = 'primary';
		const template = <Button.tag variant={variant}>Dynamic</Button.tag>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Custom element dynamic attrs:', code);
	});

	test('transforms self-closing custom element', async ({ expect }) => {
		const source = `
		const Icon = { tag: 'custom-icon' };
		const template = <Icon.tag name="star" />;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Self-closing custom element:', code);
	});

	// ========== SVG & MATHML TESTS ==========

	test('transforms standalone SVG element', async ({ expect }) => {
		const source = `
		const template = <circle cx="50" cy="50" r="40" />;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Standalone SVG:', code);
	});

	test('transforms SVG with expressions', async ({ expect }) => {
		const source = `
		const radius = 40;
		const template = <circle cx="50" cy="50" r={radius} />;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('SVG with expressions:', code);
	});

	test('transforms SVG wrapped in HTML', async ({ expect }) => {
		const source = `
		const template = (
			<div>
				<svg width="100" height="100">
					<circle cx="50" cy="50" r="40" />
				</svg>
			</div>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('SVG in HTML:', code);
	});

	test('transforms standalone MathML element', async ({ expect }) => {
		const source = `
		const template = <mi>x</mi>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Standalone MathML:', code);
	});

	test('transforms complex MathML expression', async ({ expect }) => {
		const source = `
		const template = (
			<mrow>
				<mi>x</mi>
				<mo>+</mo>
				<mi>y</mi>
			</mrow>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Complex MathML:', code);
	});

	test('transforms MathML wrapped in HTML', async ({ expect }) => {
		const source = `
		const template = (
			<div>
				<math>
					<mrow>
						<mi>x</mi>
						<mo>+</mo>
						<mi>y</mi>
					</mrow>
				</math>
			</div>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('MathML in HTML:', code);
	});

	// ========== FUNCTION COMPONENT TESTS ==========

	test('transforms function component with no props', async ({ expect }) => {
		const source = `
		const template = <MyComponent />;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Function component no props:', code);
	});

	test('transforms function component with props', async ({ expect }) => {
		const source = `
		const template = <MyComponent title="Hello" count={42} />;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Function component with props:', code);
	});

	test('transforms function component with single child', async ({ expect }) => {
		const source = `
		const template = (
			<MyComponent>
				<div>Single child</div>
			</MyComponent>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Function component single child:', code);
	});

	test('transforms function component with multiple children', async ({ expect }) => {
		const source = `
		const template = (
			<MyComponent>
				<div>First child</div>
				{expression}
				<span>Second child</span>
				Text content
			</MyComponent>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Function component multiple children:', code);
	});

	test('transforms function component with expression child', async ({ expect }) => {
		const source = `
		const items = ['a', 'b', 'c'];
		const template = (
			<List>
				{items.map(item => <li key={item}>{item}</li>)}
			</List>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Function component expression child:', code);
	});

	// ========== DIRECTIVE TESTS ==========

	test('transforms element with single directive', async ({ expect }) => {
		const source = `
		const template = <div directive={myDirective()}>Content</div>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Single directive:', code);
	});

	test('transforms element with multiple directives', async ({ expect }) => {
		const source = `
		const template = <div directive={[directive1(), directive2()]}>Content</div>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Multiple directives:', code);
	});

	test('transforms element with ref directive', async ({ expect }) => {
		const source = `
		const template = <div ref={this.elementRef}>Content</div>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Ref directive:', code);
	});

	// ========== SPREAD ATTRIBUTES ==========

	test('transforms element with spread attributes', async ({ expect }) => {
		const source = `
		const props = { class: 'container', id: 'main' };
		const template = <div {...props}>Content</div>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Spread attributes:', code);
	});

	test('transforms custom element with spread attributes', async ({ expect }) => {
		const source = `
		const Button = { tag: 'custom-button' };
		const props = { variant: 'primary', size: 'large' };
		const template = <Button.tag {...props}>Submit</Button.tag>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Custom element spread:', code);
	});

	test('transforms element with mixed spread and regular attributes', async ({ expect }) => {
		const source = `
		const props = { class: 'base' };
		const template = <div id="specific" {...props} data-test="value">Content</div>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Mixed spread attributes:', code);
	});

	// ========== NESTING & COMBINATION TESTS ==========

	test('transforms nested elements', async ({ expect }) => {
		const source = `
		const template = (
			<div>
				<header>
					<h1>Title</h1>
				</header>
				<main>
					<p>Content</p>
				</main>
			</div>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Nested elements:', code);
	});

	test('transforms compiled template with standard template child', async ({ expect }) => {
		const source = `
		const Element = { tag: 'custom-element' };
		const template = (
			<div>
				<Element.tag>Nested content</Element.tag>
			</div>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Compiled with standard child:', code);
	});

	test('transforms standard template with compiled template child', async ({ expect }) => {
		const source = `
		const Element = { tag: 'custom-element' };
		const template = (
			<Element.tag>
				<div>Regular content</div>
			</Element.tag>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Standard with compiled child:', code);
	});

	test('transforms fragment with mixed content types', async ({ expect }) => {
		const source = `
		const Element = { tag: 'custom-element' };
		const template = (
			<>
				<div>Compiled content</div>
				<Element.tag>Standard content</Element.tag>
				<MyComponent>Function component</MyComponent>
			</>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Fragment mixed content:', code);
	});

	test('transforms deeply nested mixed templates', async ({ expect }) => {
		const source = `
		const Card = { tag: 'ui-card' };
		const Button = { tag: 'ui-button' };
		const template = (
			<div class="container">
				<Card.tag title="Card Title">
					<div class="content">
						<p>Some text content</p>
						<Button.tag variant="primary">
							<Icon name="save" />
							Save
						</Button.tag>
					</div>
				</Card.tag>
			</div>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Deeply nested mixed:', code);
	});

	// ========== EDGE CASES & SPECIAL SCENARIOS ==========

	test('transforms element with only whitespace content', async ({ expect }) => {
		const source = `
		const template = <div>   </div>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Whitespace only:', code);
	});

	test('transforms element with mixed text and expressions', async ({ expect }) => {
		const source = `
		const name = 'John';
		const age = 30;
		const template = <div>Hello {name}, you are {age} years old!</div>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Mixed text expressions:', code);
	});

	test('transforms element with complex nested expressions', async ({ expect }) => {
		const source = `
		const user = { profile: { name: 'John' } };
		const template = <div>Welcome, {user.profile?.name || 'Guest'}!</div>;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Complex nested expressions:', code);
	});

	test('transforms element with function call expressions', async ({ expect }) => {
		const source = `
		const template = (
			<div>
				<span>{formatDate(new Date())}</span>
				<span>{calculateTotal(items)}</span>
			</div>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Function call expressions:', code);
	});

	test('transforms fragment as root element', async ({ expect }) => {
		const source = `
		const template = (
			<>
				<div>First</div>
				<div>Second</div>
			</>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Fragment as root:', code);
	});

	test('transforms element with boolean attribute shorthand', async ({ expect }) => {
		const source = `
		const template = <input type="checkbox" checked />;
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Boolean shorthand:', code);
	});

	// ========== COMPLEX REAL-WORLD SCENARIOS ==========

	test('transforms form with mixed template types', async ({ expect }) => {
		const source = `
		const FormField = { tag: 'form-field' };
		const Button = { tag: 'custom-button' };
		const isSubmitting = false;
		const template = (
			<form onSubmit={handleSubmit}>
				<FormField.tag label="Username" required>
					<input
						type="text"
						value={formData.username}
						onChange={handleChange}
						disabled={bool => isSubmitting}
					/>
				</FormField.tag>
				<FormField.tag label="Email">
					<input
						type="email"
						value={formData.email}
						onChange={handleChange}
					/>
				</FormField.tag>
				<div class="form-actions">
					<Button.tag
						type="submit"
						variant="primary"
						disabled={bool => isSubmitting}
						directive={[loading(isSubmitting)]}
					>
						{isSubmitting ? 'Submitting...' : 'Submit'}
					</Button.tag>
					<ValidationMessages errors={errors} />
				</div>
			</form>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Complex form:', code);
	});

	test('transforms data table with dynamic content', async ({ expect }) => {
		const source = `
		const TableRow = { tag: 'table-row' };
		const TableCell = { tag: 'table-cell' };
		const template = (
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Age</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{users.map(user => (
							<TableRow.tag key={user.id}>
								<TableCell.tag>{user.name}</TableCell.tag>
								<TableCell.tag>{user.age}</TableCell.tag>
								<TableCell.tag>
									<ActionButton
										onClick={prop => () => editUser(user.id)}
										icon="edit"
									/>
									<ActionButton
										onClick={prop => () => deleteUser(user.id)}
										icon="delete"
										variant="danger"
									/>
								</TableCell.tag>
							</TableRow.tag>
						))}
					</tbody>
				</table>
			</div>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Data table:', code);
	});

	test('transforms dashboard layout with components and templates', async ({ expect }) => {
		const source = `
		const Card = { tag: 'ui-card' };
		const Grid = { tag: 'ui-grid' };
		const Sidebar = { tag: 'ui-sidebar' };
		const template = (
			<div class="dashboard">
				<header class="dashboard-header">
					<h1>Dashboard</h1>
					<UserMenu user={currentUser} />
				</header>
				<div class="dashboard-body">
					<Sidebar.tag position="left">
						<NavigationMenu items={menuItems} />
					</Sidebar.tag>
					<main class="dashboard-content">
						<Grid.tag cols="2" gap="large">
							<Card.tag title="Statistics" span="2">
								<StatsChart
									data={chartData}
									type="line"
									directive={[resize()]}
								/>
							</Card.tag>
							<Card.tag title="Recent Activity">
								<ActivityFeed
									items={activities}
									maxItems={10}
								/>
							</Card.tag>
							<Card.tag title="Quick Actions">
								<div class="action-grid">
									{quickActions.map(action => (
										<ActionCard
											key={action.id}
											title={action.title}
											icon={action.icon}
											onClick={action.handler}
											disabled={bool => action.disabled}
										/>
									))}
								</div>
							</Card.tag>
						</Grid.tag>
					</main>
				</div>
			</div>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Dashboard layout:', code);
	});

	test('transforms modal with portal and dynamic content', async ({ expect }) => {
		const source = `
		const Modal = { tag: 'ui-modal' };
		const Portal = { tag: 'ui-portal' };
		const Button = { tag: 'ui-button' };
		const template = (
			<Portal.tag target="body">
				<Modal.tag
					open={bool => isOpen}
					onClose={handleClose}
					directive={[
						trapFocus(),
						preventScroll(),
						clickOutside(handleClose)
					]}
				>
					<div class="modal-header">
						<h2>{title}</h2>
						<Button.tag
							variant="ghost"
							size="small"
							onClick={handleClose}
							aria-label="Close"
						>
							<CloseIcon />
						</Button.tag>
					</div>
					<div class="modal-body">
						{content || (
							<DefaultContent
								type={contentType}
								data={contentData}
							/>
						)}
					</div>
					<div class="modal-footer">
						{actions.map(action => (
							<Button.tag
								key={action.id}
								variant={action.variant || 'secondary'}
								onClick={action.handler}
								disabled={bool => action.disabled}
							>
								{action.label}
							</Button.tag>
						))}
					</div>
				</Modal.tag>
			</Portal.tag>
		);
		`;

		const result = await babel.transformAsync(source, getOpts());
		const code = result?.code;
		// TODO: Add expected output
		console.log('Modal with portal:', code);
	});
});
