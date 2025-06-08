import type { PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';

import { isComponent } from './compiler-utils.ts';


export const transformJSX: VisitNode<
	PluginPass, t.JSXElement | t.JSXFragment
> = (path): void => {
	// If the path is a JSX fragment we need to strip out the fragment
	// and replace it with a JSX element that will be handled later.
	if (t.isJSXFragment(path.node)) {
		// If it's a JSX fragment, we replace it with a JSX element
		// with a `DISCARD_TAG`, which will be handled later.
		// this lets us strip the fragment without losing its children.
		const discardWrapper = t.jSXElement(
			t.jSXOpeningElement(t.jSXIdentifier(DISCARD_TAG), [], false),
			t.jSXClosingElement(t.jSXIdentifier(DISCARD_TAG)),
			path.node.children,
			false,
		);

		return void path.replaceWith(discardWrapper);
	}
	else {
		// If the parent is not a JSX element,
		// we need to wrap the JSX in a tagged template expression
		if (!t.isJSXElement(path.parent)) {
			return void path.replaceWith(
				wrapJSXElementInTTL(path as NodePath<t.JSXElement>),
			);
		}
	}
};


const wrapJSXElementInTTL = (
	initialPath: NodePath<t.JSXElement>,
	program?: t.Program,
): t.TaggedTemplateExpression => {
	program ??= initialPath.findParent(p => t.isProgram(p.node))?.node as t.Program | undefined;
	if (!program)
		throw new Error('No program found for JSX transformation.');

	const builder = new TemplateBuilder();

	let isStatic = false;

	// We create a function to process the JSX element recursively.
	// This will allow us to handle nested elements and attributes.
	const process = (path: NodePath<t.JSXElement>): void => {
		const openingElement = path.node.openingElement;

		if (!t.isJSXIdentifier(openingElement.name))
			throw new Error('Dynamic tag names are not supported yet.');

		const tagName = openingElement.name.name;
		let isComponentTag: boolean = false;
		let literalName: string = '';

		// If the tag name is `DISCARD_TAG`, we skip it.
		// but we still need to process its children.
		if (tagName !== DISCARD_TAG) {
			isComponentTag = isComponent(tagName);

			if (isComponentTag) {
				// If it's a component, we will use lit static html function to wrap this parent.
				// then we create a static literal for the tag name at the top of the file.
				// and use that static literal in the template.
				// This will allow us to use the component as a tag name.

				isStatic = true;

				// Inject the unsafeStatic variable at the top of the file.
				const literalIdentifier = ensure.componentLiteral(
					tagName, COMPONENT_LITERAL_PREFIX + tagName, path, program,
				);

				literalName = literalIdentifier.name;

				builder.addText(' <');
				builder.addExpression(literalIdentifier);
			}
			else {
				builder.addText(' <' + tagName);
			}

			const attributes = path.node.openingElement.attributes;
			attributes.forEach((attr, index) => {
				if (t.isJSXSpreadAttribute(attr)) {
					// If it's a spread attribute, we wrap it in our custom
					// `rest` directive.
					// This will allow us to handle the spread attribute correctly.
					// We also need to ensure that the `rest` directive is imported.
					ensure.restImport(program, path);

					const attrPath = path
						.get(`openingElement.attributes.${ index }.argument`);

					const newExpression = t.callExpression(
						t.identifier('rest'),
						[ attr.argument ],
					);
					attrPath.replaceWith(newExpression);

					builder.addText(' ');
					builder.addExpression(newExpression);

					console.log(attr);


					return;
				}

				const name = attr.name.name.toString();
				if (attr.value) {
					if (t.isJSXExpressionContainer(attr.value)) {
						// If the expression is empty, we can skip it.
						// This should not happen in valid JSX.
						if (t.isJSXEmptyExpression(attr.value.expression))
							throw new Error('Empty JSX expression found.');

						const params: AttrExpressionParams = {
							builder,
							attr: attr as AttrExpressionParams['attr'],
							path,
							program,
						};

						if (name === ATTRIBUTES.REF)
							attributeProcessors.ref(params);
						else if (name === ATTRIBUTES.CLASS_LIST)
							attributeProcessors.classList(params);
						else if (name === ATTRIBUTES.STYLE)
							attributeProcessors.style(params);
						else if (name.startsWith(ATTRIBUTES.EVENT_PREFIX))
							attributeProcessors.event(params);
						else
							attributeProcessors.expression(params);

						builder.addExpression(attr.value.expression);
					}
					else {
						attributeProcessors.rest({
							builder,
							attr: attr as AttrNonExpressionParams['attr'],
							path,
							program,
						});
					}
				}
				else {
					// If the attribute has no value, we can add it as a boolean attribute.
					builder.addText(' ' + name);
				}
			});

			builder.addText('>'); // Close the opening tag
		}

		path.node.children.forEach((child, index) => {
			if (t.isJSXText(child)) {
				//  We only preserve whitespace in pre and textarea tags.
				if (WHITESPACE_TAGS.includes(tagName))
					builder.addText(child.value);
				else
					builder.addText(child.value.trim());
			}
			else if (t.isJSXElement(child)) {
				// Recursively process child elements
				const childPath = path
					.get(`children.${ index }`) as NodePath<t.JSXElement>;

				process(childPath);
			}
			else if (t.isJSXExpressionContainer(child)) {
				if (t.isJSXEmptyExpression(child.expression))
					return;

				builder.addExpression(child.expression);
			}
		});

		// If the tag is `DISCARD_TAG` we skip, as we did not add the opening tag.
		if (tagName === DISCARD_TAG) { /*  */ }
		// Add closing tag.
		else {
			// If it's a component tag, we need to close it with the static literal.
			if (isComponentTag) {
				builder.addText(' </');
				builder.addExpression(t.identifier(literalName));
				builder.addText('>');
			}
			else {
				builder.addText(' </' + tagName + '>');
			}
		}
	};

	process(initialPath);

	let identifier: string = '';

	if (isStatic) {
		identifier = VARIABLES.HTML_STATIC;
		ensure.htmlStaticImport(program, initialPath);
		ensure.unsafeStaticImport(program, initialPath);
	}
	else {
		identifier = VARIABLES.HTML;
		ensure.htmlImport(program, initialPath);
	}

	return builder.createTaggedTemplate(identifier);
};


const COMPONENT_LITERAL_PREFIX = '__$';
const DISCARD_TAG = 'discard';
const WHITESPACE_TAGS = [ 'pre', 'textarea' ];
const ATTRIBUTES = {
	REF:          'ref',
	CLASS_LIST:   'classList',
	STYLE:        'style',
	EVENT_PREFIX: 'on-',
};
const VARIABLES = {
	HTML_STATIC: 'htmlStatic',
	HTML:        'html',
	CLASS_MAP:   'classMap',
	STYLE_MAP:   'styleMap',
	REF:         'ref',
	REST:        '__$rest',
	LITERAL_MAP: '__$literalMap',
};
const SOURCES = {
	HTML:        'lit-html',
	HTML_STATIC: 'lit-html/static.js',
	REF:         'lit-html/directives/ref.js',
	CLASS_MAP:   'lit-html/directives/class-map.js',
	STYLE_MAP:   'lit-html/directives/style-map.js',
	REST:        '@roenlie/lit-jsx/utils',
	LITERAL_MAP: '@roenlie/lit-jsx/utils',
};


interface AttrParams {
	builder: TemplateBuilder;
	attr:    unknown;
	path:    NodePath<t.JSXElement>;
	program: t.Program;
}


interface AttrExpressionParams extends AttrParams {
	attr:    t.JSXAttribute & {
		value: t.JSXExpressionContainer & {
			expression: t.Expression;
		};
	};
}

interface AttrNonExpressionParams extends AttrParams {
	attr:    t.JSXAttribute & {
		value: Exclude<t.JSXAttribute['value'], t.JSXExpressionContainer>;
	};
}

const attributeProcessors = {
	ref(params: AttrExpressionParams): void {
		// add a space to keep correct spacing in the template.
		params.builder.addText(' ');

		// add a ref call around the expression.
		params.attr.value.expression = t.callExpression(
			t.identifier(VARIABLES.REF),
			[ params.attr.value.expression ],
		);

		ensure.createRefImport(params.program, params.path);
	},
	classList(params: AttrExpressionParams): void {
		// add classlist without the . to the quasi.
		params.builder.addText(' class=');

		// add a classMap call around the expression.
		params.attr.value.expression = t.callExpression(
			t.identifier(VARIABLES.CLASS_MAP),
			[ params.attr.value.expression ],
		);

		ensure.classMapImport(params.program, params.path);
	},
	style(params: AttrExpressionParams): void {
		params.builder.addText(' ' + params.attr.name.name.toString() + '=');

		// add a styleMap call around the expression.
		params.attr.value.expression = t.callExpression(
			t.identifier(VARIABLES.STYLE_MAP),
			[ params.attr.value.expression ],
		);

		ensure.styleMapImport(params.program, params.path);
	},
	event(params: AttrExpressionParams): void {
		// If the attribute is an event handler,
		// we need to convert it to a standard DOM event name.
		const oldName = params.attr.name.name.toString();
		const newName = '@' + oldName.slice(3);
		params.attr.name = t.jSXIdentifier(newName);
		params.builder.addText(' ' + newName + '=');
	},
	expression(params: AttrExpressionParams): void {
		// Any other attribute which has an expression container value
		// we convert to an object property.
		// This is the easiest, as it supports all types.
		// In the future, we might want to support more types, such as:
		// - boolean attributes
		// - number attributes
		// - string attributes
		// This requires compile time type checking,
		// which is not supported by this plugin yet.
		const oldName = params.attr.name.name.toString();
		const newName = '.' + oldName;
		params.attr.name = t.jSXIdentifier(newName);
		params.builder.addText(' ' + newName + '=');
	},
	rest(params: AttrNonExpressionParams): void {
		// If the value is a string, we can use it directly
		// Here we always bind the value as a string.
		// In the future, we might want to also support numbers.
		if (!t.isStringLiteral(params.attr.value))
			throw new Error('Only string literals are supported for JSX attributes.');

		const name = params.attr.name.name.toString();
		params.builder.addText(' ' + name + '="' + params.attr.value.value + '"');
	},
};


const ensure = {
	import(
		importSource: (value: string) => boolean,
		importName: (value: string) => boolean,
		createImport: () => t.ImportDeclaration,
		program: t.Program,
		path: NodePath,
	): void {
		// Check if the import already exists
		const hasImport = program.body.some(node => {
			if (!t.isImportDeclaration(node))
				return false;

			// Check if the import source matches
			const isCorrectImport = importSource(node.source.value);
			if (!isCorrectImport)
				return false;

			// Check if the import name matches
			return node.specifiers.some(spec => {
				return t.isImportSpecifier(spec)
					? t.isIdentifier(spec.imported)
						? importName(spec.imported.name)
						: importName(spec.imported.value)
					: false;
			});
		});

		// If not found, add the import
		if (!hasImport) {
			const importDeclaration = createImport();
			const programPath = path.findParent(p => t.isProgram(p.node)) as NodePath<t.Program>;

			// Insert at the top of the file
			const [ insertedPath ] = programPath.unshiftContainer('body', importDeclaration);
			programPath.scope.registerDeclaration(insertedPath);
		}
	},
	htmlImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === 'lit' || source === 'lit-html',
			(name) => name === VARIABLES.HTML,
			() => t.importDeclaration(
				[ t.importSpecifier(t.identifier(VARIABLES.HTML), t.identifier(VARIABLES.HTML)) ],
				t.stringLiteral('lit-html'),
			),
			program,
			path,
		);
	},
	htmlStaticImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === 'lit/static-html.js' || source === 'lit-html/static.js',
			(name) => name === VARIABLES.HTML,
			() => t.importDeclaration(
				[ t.importSpecifier(t.identifier(VARIABLES.HTML_STATIC), t.identifier(VARIABLES.HTML)) ],
				t.stringLiteral('lit-html/static.js'),
			),
			program,
			path,
		);
	},
	unsafeStaticImport(program: t.Program, path: NodePath): void {
		const sourceName = 'lit-html/static.js';
		const identifierName = 'unsafeStatic';

		this.import(
			(source) => source === 'lit/static-html.js' || source === sourceName,
			(name) => name === 'unsafeStatic',
			() => t.importDeclaration(
				[ t.importSpecifier(t.identifier(identifierName), t.identifier(identifierName)) ],
				t.stringLiteral(sourceName),
			),
			program,
			path,
		);
	},
	createRefImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === 'lit/directives/ref.js' || source === 'lit-html/directives/ref.js',
			(name) => name === VARIABLES.REF,
			() => t.importDeclaration(
				[ t.importSpecifier(t.identifier(VARIABLES.REF), t.identifier(VARIABLES.REF)) ],
				t.stringLiteral('lit-html/directives/ref.js'),
			),
			program,
			path,
		);
	},
	styleMapImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === 'lit/directives/style-map.js' || source === 'lit-html/directives/style-map.js',
			(name) => name === VARIABLES.STYLE_MAP,
			() => t.importDeclaration(
				[ t.importSpecifier(t.identifier(VARIABLES.STYLE_MAP), t.identifier(VARIABLES.STYLE_MAP)) ],
				t.stringLiteral('lit-html/directives/style-map.js'),
			),
			program,
			path,
		);
	},
	classMapImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === 'lit/directives/class-map.js' || source === 'lit-html/directives/class-map.js',
			(name) => name === VARIABLES.CLASS_MAP,
			() => t.importDeclaration(
				[ t.importSpecifier(t.identifier(VARIABLES.CLASS_MAP), t.identifier(VARIABLES.CLASS_MAP)) ],
				t.stringLiteral('lit-html/directives/class-map.js'),
			),
			program,
			path,
		);
	},
	restImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === '@roenlie/lit-jsx/utils',
			(name) => name === VARIABLES.REST,
			() => t.importDeclaration(
				[
					t.importSpecifier(
						t.identifier(VARIABLES.REST),
						t.identifier(VARIABLES.REST),
					),
				],
				t.stringLiteral('@roenlie/lit-jsx/utils'),
			),
			program,
			path,
		);
	},
	literalMapImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === '@roenlie/lit-jsx/utils',
			(name) => name === VARIABLES.LITERAL_MAP,
			() => t.importDeclaration(
				[
					t.importSpecifier(
						t.identifier(VARIABLES.LITERAL_MAP),
						t.identifier(VARIABLES.LITERAL_MAP),
					),
				],
				t.stringLiteral('@roenlie/lit-jsx/utils'),
			),
			program,
			path,
		);
	},
	componentTagDeclaration(
		path: NodePath,
		tagName: string,
		variableName: string,
		createDeclaration: () => t.VariableDeclarator,
	): t.Identifier {
		// Start from the current scope and work upward
		let currentScope = path.scope;

		while (currentScope) {
			// First check if the prefixed variable already exists
			const prefixedBinding = currentScope.getBinding(variableName);
			if (prefixedBinding)
				return t.identifier(variableName);

			// Then check if the tagName exists
			const tagNameBinding = currentScope.getBinding(tagName);
			if (tagNameBinding) {
				// Found the tagName binding, now insert the prefixed declaration just below it
				const declarator = createDeclaration();
				const variableDeclaration = t.variableDeclaration('const', [ declarator ]);

				// Find the statement-level path to insert after
				// This handles cases where the binding might be an import specifier or variable declarator
				let statementPath: NodePath<t.Node> | null = tagNameBinding.path;
				while (statementPath && !statementPath.isStatement())
					statementPath = statementPath.parentPath;

				if (!statementPath)
					throw new Error(`Could not find statement-level path for tagName: ${ tagName }`);

				// Insert the new declaration after the tagName declaration
				const [ insertedPath ] = statementPath.insertAfter(variableDeclaration);

				// Register the new declaration with the appropriate scope
				statementPath.scope.registerDeclaration(insertedPath);

				return t.identifier(variableName);
			}

			// Move up to the parent scope
			currentScope = currentScope.parent;
		}

		// If tagName is not found in any scope, throw an error
		throw new Error(`Tag name '${ tagName }' not found in any accessible scope`);
	},
	componentLiteral(
		tagName: string,
		variableName: string,
		path: NodePath,
		program: t.Program,
	): t.Identifier {
		this.literalMapImport(program, path);

		return this.componentTagDeclaration(
			path,
			tagName,
			variableName,
			() => t.variableDeclarator(
				t.identifier(variableName),
				t.callExpression(
					t.memberExpression(
						t.identifier(VARIABLES.LITERAL_MAP),
						t.identifier('get'),
					),
					[ t.identifier(tagName) ],
				),
			),
		);
	},
};


class TemplateBuilder {

	protected currentQuasi = '';
	protected quasis:      t.TemplateElement[] = [];
	protected expressions: (t.Expression | t.TSType)[] = [];

	protected commitQuasi(): void {
		this.quasis.push(t.templateElement({ raw: this.currentQuasi, cooked: '' }));
		this.currentQuasi = '';
	}

	addText(text: string): void {
		this.currentQuasi += text;
	}

	addExpression(expression: t.Expression): void {
		this.commitQuasi();
		this.expressions.push(expression);
	}

	createTaggedTemplate(identifier: string): t.TaggedTemplateExpression {
		if (this.currentQuasi)
			this.commitQuasi();

		const ttl = t.taggedTemplateExpression(
			t.identifier(identifier),
			t.templateLiteral(this.quasis, this.expressions),
		);

		this.quasis = [];
		this.expressions = [];

		return ttl;
	}

}
