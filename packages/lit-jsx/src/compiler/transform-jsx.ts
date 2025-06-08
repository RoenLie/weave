import type { PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';

import { isComponent } from './utils.ts';


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

	const quasis: t.TemplateElement[] = [];
	const expressions: (t.Expression | t.TSType)[] = [];
	let currentQuasi: string = '';

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
					tagName, '__$' + tagName, path, program,
				);

				literalName = literalIdentifier.name;

				currentQuasi += ' <';
				// Commit the current quasi to the quasis array
				quasis.push(t.templateElement({ raw: currentQuasi, cooked: '' }));
				currentQuasi = ''; // Reset current quasi.

				// add the literal to the template
				expressions.push(literalIdentifier);
			}
			else {
				currentQuasi += ' <' + tagName;
			}

			const attributes = path.node.openingElement.attributes;
			attributes.forEach(attr => {
				if (t.isJSXSpreadAttribute(attr))
					return;

				const name = attr.name.name.toString();
				if (attr.value) {
					if (t.isJSXExpressionContainer(attr.value)) {
						// If the expression is empty, we can skip it
						if (t.isJSXEmptyExpression(attr.value.expression))
							return;

						if (name === ATTRIBUTES.REF) {
							// add a space to keep correct spacing in the template.
							currentQuasi += ' ';

							// add a ref call around the expression.
							attr.value.expression = t.callExpression(
								t.identifier('ref'),
								[ attr.value.expression ],
							);

							ensure.createRefImport(program, path);
						}
						else if (name === ATTRIBUTES.CLASS_LIST) {
							// add classlist without the . to the quasi.
							currentQuasi += ' class=';

							// add a classMap call around the expression.
							attr.value.expression = t.callExpression(
								t.identifier('classMap'),
								[ attr.value.expression ],
							);

							ensure.classMapImport(program, path);
						}
						else if (name === ATTRIBUTES.STYLE) {
							// add style without the . to the quasi.
							currentQuasi += ' style=';

							// add a styleMap call around the expression.
							attr.value.expression = t.callExpression(
								t.identifier('styleMap'),
								[ attr.value.expression ],
							);

							ensure.styleMapImport(program, path);
						}
						else if (name.startsWith(ATTRIBUTES.EVENT_PREFIX)) {
							// If the attribute is an event handler,
							// we need to convert it to a standard DOM event name.

							attr.name = t.jSXIdentifier('@' + name.slice(3));
							currentQuasi += ' ' + attr.name.name.toString() + '=';
						}
						else {
							// Any other attribute which has an expression container value
							// we convert to an object property.
							// This is the easiest, as it supports all types.
							// In the future, we might want to support more types, such as:
							// - boolean attributes
							// - number attributes
							// - string attributes
							// This requires compile time type checking,
							// which is not supported by this plugin yet.

							attr.name = t.jSXIdentifier('.' + name);
							currentQuasi += ' ' + attr.name.name.toString() + '=';
						}

						// Commit the current quasi to the quasis array
						quasis.push(t.templateElement({ raw: currentQuasi, cooked: '' }));
						currentQuasi = ''; // Reset current quasi for the next attribute

						// add the expression to the template
						expressions.push(attr.value.expression);
					}
					else {
						// If the value is a string, we can use it directly
						// Here we always bind the value as a string.
						// In the future, we might want to also support numbers.
						if (!t.isStringLiteral(attr.value))
							throw new Error('Only string literals are supported for JSX attributes.');

						currentQuasi += ' ' + name + '="' + attr.value.value + '"';
					}
				}
				else {
					currentQuasi += ' ' + name;
				}
			});

			currentQuasi += '>'; // Close the opening tag
		}

		path.node.children.forEach(child => {
			if (t.isJSXText(child)) {
				//  We only preserve whitespace in pre and textarea tags.
				currentQuasi += WHITESPACE_TAGS.includes(tagName)
					?  child.value
					: child.value.trim();
			}
			else if (t.isJSXElement(child)) {
				// Recursively process child elements
				const childPath = path.get('children').find(p => p.node === child);
				if (childPath && t.isJSXElement(childPath.node))
					process(childPath as NodePath<t.JSXElement>);
			}
			else if (t.isJSXExpressionContainer(child)) {
				if (t.isJSXEmptyExpression(child.expression))
					return;

				quasis.push(t.templateElement({ raw: currentQuasi, cooked: '' }));
				currentQuasi = '';

				expressions.push(child.expression);
			}
		});

		// If the tag is `DISCARD_TAG` we skip, as we did not add the opening tag.
		if (tagName === DISCARD_TAG) { /*  */ }
		// Add closing tag.
		else {
			// If it's a component tag, we need to close it with the static literal.
			if (isComponentTag) {
				currentQuasi += ' </';

				// Commit the current quasi to the quasis array
				quasis.push(t.templateElement({ raw: currentQuasi, cooked: '' }));
				currentQuasi = '>'; // Reset and add the closing tag.

				// add the literal to the template
				expressions.push(t.identifier(literalName));
			}
			else {
				currentQuasi += ' </' + tagName + '>';
			}
		}
	};

	process(initialPath);

	let identifier: string = '';

	if (isStatic) {
		identifier = 'htmlStatic';
		ensure.htmlStaticImport(program, initialPath);
		ensure.unsafeStaticImport(program, initialPath);
	}
	else {
		identifier = 'html';
		ensure.htmlImport(program, initialPath);
	}

	// If there is any remaining text in currentQuasi, we need to add it as a final quasi.
	// template expressions require there to be exactly 1 more quasi than expressions.
	quasis.push(t.templateElement({ raw: currentQuasi, cooked: '' }));

	const template = t.taggedTemplateExpression(
		t.identifier(identifier),
		t.templateLiteral(quasis, expressions),
	);

	return template;
};


const ATTRIBUTES = {
	REF:          'ref',
	CLASS_LIST:   'classList',
	STYLE:        'style',
	EVENT_PREFIX: 'on-',
};

const DISCARD_TAG = 'discard';
const WHITESPACE_TAGS = [ 'pre', 'textarea' ];


const attributeProcessors = {
	//ref:       (attr, context) => processRefAttribute(attr, context),
	//classList: (attr, context) => processClassListAttribute(attr, context),
	//style:     (attr, context) => processStyleAttribute(attr, context),
	// ...
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
			(name) => name === 'html',
			() => t.importDeclaration(
				[ t.importSpecifier(t.identifier('html'), t.identifier('html')) ],
				t.stringLiteral('lit-html'),
			),
			program,
			path,
		);
	},
	htmlStaticImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === 'lit/static-html.js' || source === 'lit-html/static.js',
			(name) => name === 'html',
			() => t.importDeclaration(
				[ t.importSpecifier(t.identifier('htmlStatic'), t.identifier('html')) ],
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
			(name) => name === 'unsafeStatic',
			() => t.importDeclaration(
				[ t.importSpecifier(t.identifier('ref'), t.identifier('ref')) ],
				t.stringLiteral('lit-html/directives/ref.js'),
			),
			program,
			path,
		);
	},
	styleMapImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === 'lit/directives/style-map.js' || source === 'lit-html/directives/style-map.js',
			(name) => name === 'styleMap',
			() => t.importDeclaration(
				[ t.importSpecifier(t.identifier('styleMap'), t.identifier('styleMap')) ],
				t.stringLiteral('lit-html/directives/style-map.js'),
			),
			program,
			path,
		);
	},
	classMapImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === 'lit/directives/class-map.js' || source === 'lit-html/directives/class-map.js',
			(name) => name === 'classMap',
			() => t.importDeclaration(
				[ t.importSpecifier(t.identifier('classMap'), t.identifier('classMap')) ],
				t.stringLiteral('lit-html/directives/class-map.js'),
			),
			program,
			path,
		);
	},
	componentLiteralMapImport(program: t.Program, path: NodePath): void {
		const sourceName = '@roenlie/lit-jsx/literals';
		const identifierName = 'componentLiteralMap';

		this.import(
			(source) => source === sourceName,
			(name) => name === identifierName,
			() => t.importDeclaration(
				[ t.importSpecifier(t.identifier(identifierName), t.identifier(identifierName)) ],
				t.stringLiteral(sourceName),
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
		// Ensure the componentLiteralMap is imported
		this.componentLiteralMapImport(program, path);

		// Create the variable declaration using the WeakMap
		return this.componentTagDeclaration(
			path,
			tagName,
			variableName,
			() => t.variableDeclarator(
				t.identifier(variableName),
				t.callExpression(
					t.memberExpression(
						t.identifier('componentLiteralMap'),
						t.identifier('get'),
					),
					[ t.identifier(tagName) ],
				),
			),
		);
	},
};


class TemplateBuilder {

	private currentQuasi = '';
	private quasis:      t.TemplateElement[] = [];
	private expressions: (t.Expression | t.TSType)[] = [];

	commitQuasi(): void {
		this.quasis.push(t.templateElement({ raw: this.currentQuasi, cooked: '' }));
		this.currentQuasi = '';
	}

	addText(text: string): void {
		this.currentQuasi += text;
	}

	addExpression(expression: t.Expression | t.TSType): void {
		this.commitQuasi();
		this.expressions.push(expression);
	}

}
