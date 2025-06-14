import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

import { isMathmlTag } from '../shared/mathml-tags.ts';
import { isSvgTag } from '../shared/svg-tags.ts';
import { ATTR_BIND_OBJ_NAME, ATTR_VALUES, COMPONENT_POSTFIX, ERROR_MESSAGES, SOURCES, VARIABLES } from './config.ts';

export type Values<T> = T[keyof T];


export const isComponent = (tagName: string): boolean => {
	return (tagName[0] && tagName[0].toLowerCase() !== tagName[0])
		|| tagName.includes('.')
		|| /[^a-zA-Z]/.test(tagName[0] ?? '');
};

export const determineTemplateType = (
	tagName: string,
): Values<Pick<typeof VARIABLES, 'HTML' | 'SVG' | 'MATHML'>> => {
	if (isSvgTag(tagName))
		return VARIABLES.SVG;

	if (isMathmlTag(tagName))
		return VARIABLES.MATHML;

	return VARIABLES.HTML;
};


export class TemplateBuilder {

	protected currentQuasi: string[] = [];
	protected quasis:       t.TemplateElement[] = [];
	protected expressions:  (t.Expression | t.TSType)[] = [];

	protected commitQuasi(): void {
		this.quasis.push(t.templateElement({ raw: this.currentQuasi.join(''), cooked: '' }));
		this.currentQuasi.length = 0;
	}

	addText(text: string): void {
		this.currentQuasi.push(text);
	}

	addExpression(expression: t.Expression): void {
		this.commitQuasi();
		this.expressions.push(expression);
	}

	createTaggedTemplate(identifier: string): t.TaggedTemplateExpression {
		if (this.currentQuasi.length)
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


interface AttrParams {
	builder: TemplateBuilder;
	attr:    any;
	index:   number;
	path:    NodePath<t.JSXElement>;
	program: t.Program;
}

export interface AttrExpressionParams extends AttrParams {
	attr:    t.JSXAttribute & {
		value: t.JSXExpressionContainer & {
			expression: t.Expression;
		};
	};
}

export interface AttrArrowExpressionParams extends AttrParams {
	attr:    t.JSXAttribute & {
		value: t.JSXExpressionContainer & {
			expression: t.ArrowFunctionExpression & {
				params: [ t.Identifier & { name: Values<typeof ATTR_VALUES>; } ];
				body:   t.Expression;
			};
		};
	};
}

export interface AttrMemberExpressionParams extends AttrParams {
	attr:    t.JSXAttribute & {
		value: t.JSXExpressionContainer & {
			expression: t.CallExpression & {
				callee: t.MemberExpression & {
					object:   t.Identifier;
					property: t.Identifier;
				};
				arguments: [ t.Expression ];
			};
		};
	};
}

//export interface AttrSpreadParams extends AttrParams {
//	attr: t.JSXSpreadAttribute & {
//		argument: t.CallExpression & {
//			callee:    t.Identifier;
//			arguments: [ t.Expression ];
//		};
//	};
//}

export interface AttrNonExpressionParams extends AttrParams {
	attr:    t.JSXAttribute & {
		value: Exclude<t.JSXAttribute['value'], t.JSXExpressionContainer>;
	};
}

export const attributeProcessors = {
	callBinding(params: AttrMemberExpressionParams): void {
		const expression = params.attr.value.expression;
		const isProp = expression.callee.property.name === ATTR_VALUES.PROP;
		const isBool = expression.callee.property.name === ATTR_VALUES.BOOL;

		if (isProp)
			params.builder.addText(' .');
		else if (isBool)
			params.builder.addText(' ?');
		else
			throw new Error(ERROR_MESSAGES.INVALID_DIRECTIVE_RETURN_TYPE);

		const name = params.attr.name.name.toString();
		const argument = expression.arguments[0];

		params.builder.addText(name + '=');
		params.builder.addExpression(argument);
	},
	arrowBinding(params: AttrArrowExpressionParams): void {
		const expression = params.attr.value.expression;
		const param = expression.params[0];
		const isProp = param.name === ATTR_VALUES.PROP;
		const isBool = param.name === ATTR_VALUES.BOOL;

		if (isProp)
			params.builder.addText(' .');
		else if (isBool)
			params.builder.addText(' ?');
		else
			throw new Error(ERROR_MESSAGES.INVALID_DIRECTIVE_RETURN_TYPE);

		const name = params.attr.name.name.toString();
		const expressionBody = expression.body;

		params.builder.addText(name + '=');
		params.builder.addExpression(expressionBody);
	},
	directive(params: AttrExpressionParams): void {
		// Replace the spread attribute with its argument, minus the compiler func.
		const expression = params.attr.value.expression;
		if (t.isCallExpression(expression)) {
			// If the expression is a call, we can add it directly.
			params.builder.addText(' ');
			params.builder.addExpression(expression);
		}
		else if (t.isArrayExpression(expression)) {
			for (const item of expression.elements) {
				if (!t.isExpression(item))
					throw new Error(ERROR_MESSAGES.EMPTY_JSX_EXPRESSION);

				// Add a space to keep correct spacing in the template.
				params.builder.addText(' ');
				params.builder.addExpression(item);
			}
		}
		else {
			throw new Error(ERROR_MESSAGES.INVALID_DIRECTIVE_RETURN_TYPE);
		}
		// If the expression is not a call or array, we can just add it as an expression.

		//params.builder.addText(' ');
		//params.builder.addExpression(params.attr.argument.arguments[0]);
	},
	ref(params: AttrExpressionParams): void {
		// add a ref call around the expression.
		const expression = t.callExpression(
			t.identifier(VARIABLES.REF),
			[ params.attr.value.expression ],
		);

		// add a space to keep correct spacing in the template.
		params.builder.addText(' ');
		params.builder.addExpression(expression);

		ensure.createRefImport(params.program, params.path);
	},
	classList(params: AttrExpressionParams): void {
		// add a classMap call around the expression.
		const expression = t.callExpression(
			t.identifier(VARIABLES.CLASS_MAP),
			[ params.attr.value.expression ],
		);

		// add classlist without the . to the quasi.
		params.builder.addText(' class=');
		params.builder.addExpression(expression);

		ensure.classMapImport(params.program, params.path);
	},
	styleList(params: AttrExpressionParams): void {
		const name = params.attr.name.name.toString();

		// add a styleMap call around the expression.
		const expression = t.callExpression(
			t.identifier(VARIABLES.STYLE_MAP),
			[ params.attr.value.expression ],
		);

		params.builder.addText(' ' + name + '=');
		params.builder.addExpression(expression);

		ensure.styleMapImport(params.program, params.path);
	},
	event(params: AttrExpressionParams): void {
		// If the attribute is an event handler,
		// we need to convert it to a standard DOM event name.
		const oldName = params.attr.name.name.toString();
		const newName = '@' + oldName.slice(3);
		params.builder.addText(' ' + newName + '=');
	},
	expression(params: AttrExpressionParams): void {
		// Any other attribute which has an expression container value
		const name = params.attr.name.name.toString();
		params.builder.addText(' ' + name + '=');
		params.builder.addExpression(params.attr.value.expression);
	},
	nonExpression(params: AttrNonExpressionParams): void {
		// If the value is a string, we can use it directly
		// Here we always bind the value as a string.
		// In the future, we might want to also support numbers.
		if (!t.isStringLiteral(params.attr.value))
			throw new Error(ERROR_MESSAGES.ONLY_STRING_LITERALS);

		const name = params.attr.name.name.toString();
		const value = params.attr.value.value;
		params.builder.addText(' ' + name + '="' + value + '"');
	},
} as const;


export const isCallExpressionBinding = (
	expression: t.Expression,
): expression is AttrMemberExpressionParams['attr']['value']['expression'] => {
	if (!t.isCallExpression(expression))
		return false;

	const callee = expression.callee;
	if (!t.isMemberExpression(callee))
		return false;
	if (!t.isIdentifier(callee.object) || !t.isIdentifier(callee.property))
		return false;

	const objectNameMatches = callee.object.name === ATTR_BIND_OBJ_NAME;
	if (!objectNameMatches)
		return false;

	return true;
};

export const isArrowFunctionBinding = (
	expression: t.Expression,
): expression is AttrArrowExpressionParams['attr']['value']['expression'] => {
	if (!t.isArrowFunctionExpression(expression))
		return false;

	// If the arrow function has no parameters, we can skip it.
	if (expression.params.length === 0)
		return false;

	// If the arrow function has more than one parameter, we can skip it.
	if (expression.params.length > 1)
		return false;

	// If the param is not an identifier, we can skip it.
	const param = expression.params[0];
	if (!t.isIdentifier(param))
		return false;

	// If the body of the arrow function is not an expression, we can skip it.
	if (!t.isExpression(expression.body))
		return false;

	// We check if it is a valid bind parameter.
	return param.name === ATTR_VALUES.PROP
		|| param.name === ATTR_VALUES.BOOL;
};


export const ensure = {
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
			(source) => source === SOURCES.HTML || source === SOURCES.HTML_ALT,
			(name) => name === VARIABLES.HTML,
			() => t.importDeclaration(
				[ t.importSpecifier(t.identifier(VARIABLES.HTML), t.identifier(VARIABLES.HTML)) ],
				t.stringLiteral(SOURCES.HTML),
			),
			program,
			path,
		);
	},
	htmlStaticImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === SOURCES.HTML_STATIC || source === SOURCES.HTML_STATIC_ALT,
			(name) => name === VARIABLES.HTML,
			() => t.importDeclaration(
				[
					t.importSpecifier(
						t.identifier(VARIABLES.HTML_STATIC),
						t.identifier(VARIABLES.HTML),
					),
				],
				t.stringLiteral(SOURCES.HTML_STATIC),
			),
			program,
			path,
		);
	},
	svgImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === SOURCES.SVG || source === SOURCES.SVG_ALT,
			(name) => name === VARIABLES.SVG,
			() => t.importDeclaration(
				[ t.importSpecifier(t.identifier(VARIABLES.SVG), t.identifier(VARIABLES.SVG)) ],
				t.stringLiteral(SOURCES.SVG),
			),
			program,
			path,
		);
	},
	svgStaticImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === SOURCES.SVG_STATIC || source === SOURCES.SVG_STATIC_ALT,
			(name) => name === VARIABLES.SVG,
			() => t.importDeclaration(
				[
					t.importSpecifier(
						t.identifier(VARIABLES.SVG_STATIC),
						t.identifier(VARIABLES.SVG),
					),
				],
				t.stringLiteral(SOURCES.SVG_STATIC),
			),
			program,
			path,
		);
	},
	mathmlImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === SOURCES.MATHML || source === SOURCES.MATHML_ALT,
			(name) => name === VARIABLES.MATHML,
			() => t.importDeclaration(
				[ t.importSpecifier(t.identifier(VARIABLES.MATHML), t.identifier(VARIABLES.MATHML)) ],
				t.stringLiteral(SOURCES.MATHML),
			),
			program,
			path,
		);
	},
	mathmlStaticImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === SOURCES.MATHML_STATIC || source === SOURCES.MATHML_STATIC_ALT,
			(name) => name === VARIABLES.MATHML,
			() => t.importDeclaration(
				[
					t.importSpecifier(
						t.identifier(VARIABLES.MATHML_STATIC),
						t.identifier(VARIABLES.MATHML),
					),
				],
				t.stringLiteral(SOURCES.MATHML_STATIC),
			),
			program,
			path,
		);
	},
	unsafeStaticImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === SOURCES.UNSAFE_STATIC || source === SOURCES.UNSAFE_STATIC_ALT,
			(name) => name === VARIABLES.UNSAFE_STATIC,
			() => t.importDeclaration(
				[
					t.importSpecifier(
						t.identifier(VARIABLES.UNSAFE_STATIC),
						t.identifier(VARIABLES.UNSAFE_STATIC),
					),
				],
				t.stringLiteral(SOURCES.UNSAFE_STATIC),
			),
			program,
			path,
		);
	},
	createRefImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === SOURCES.REF_ALT || source === SOURCES.REF,
			(name) => name === VARIABLES.REF,
			() => t.importDeclaration(
				[
					t.importSpecifier(
						t.identifier(VARIABLES.REF),
						t.identifier(VARIABLES.REF),
					),
				],
				t.stringLiteral(SOURCES.REF),
			),
			program,
			path,
		);
	},
	styleMapImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === SOURCES.STYLE_MAP_ALT || source === SOURCES.STYLE_MAP,
			(name) => name === VARIABLES.STYLE_MAP,
			() => t.importDeclaration(
				[
					t.importSpecifier(
						t.identifier(VARIABLES.STYLE_MAP),
						t.identifier(VARIABLES.STYLE_MAP),
					),
				],
				t.stringLiteral(SOURCES.STYLE_MAP),
			),
			program,
			path,
		);
	},
	classMapImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === SOURCES.CLASS_MAP_ALT || source === SOURCES.CLASS_MAP,
			(name) => name === VARIABLES.CLASS_MAP,
			() => t.importDeclaration(
				[
					t.importSpecifier(
						t.identifier(VARIABLES.CLASS_MAP),
						t.identifier(VARIABLES.CLASS_MAP),
					),
				],
				t.stringLiteral(SOURCES.CLASS_MAP),
			),
			program,
			path,
		);
	},
	restImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === SOURCES.REST,
			(name) => name === VARIABLES.REST,
			() => t.importDeclaration(
				[
					t.importSpecifier(
						t.identifier(VARIABLES.REST),
						t.identifier(VARIABLES.REST),
					),
				],
				t.stringLiteral(SOURCES.REST),
			),
			program,
			path,
		);
	},
	literalMapImport(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === SOURCES.LITERAL_MAP,
			(name) => name === VARIABLES.LITERAL_MAP,
			() => t.importDeclaration(
				[
					t.importSpecifier(
						t.identifier(VARIABLES.LITERAL_MAP),
						t.identifier(VARIABLES.LITERAL_MAP),
					),
				],
				t.stringLiteral(SOURCES.LITERAL_MAP),
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
					throw new Error(ERROR_MESSAGES.NO_STATEMENT_PATH(tagName));

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
		throw new Error(ERROR_MESSAGES.TAG_NAME_NOT_FOUND(tagName));
	},
	componentLiteral(
		tagName: string,
		variableName: string,
		path: NodePath,
		program: t.Program,
	): t.Identifier {
		this.literalMapImport(program, path);

		variableName = variableName.replace(COMPONENT_POSTFIX, '');
		tagName = tagName.replace(COMPONENT_POSTFIX, '');

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
					[ t.identifier(tagName + COMPONENT_POSTFIX) ],
				),
			),
		);
	},
} as const;


export type ValidJSXElement = t.JSXElement & {
	openingElement: t.JSXOpeningElement & {
		name: t.JSXIdentifier | t.JSXMemberExpression;
	};
};


export const isValidJSXElement = (initialPath: NodePath): initialPath is NodePath<ValidJSXElement> => {
	const node = initialPath.node;

	return t.isJSXElement(node)
		&& t.isJSXOpeningElement(node.openingElement)
		&& (t.isJSXIdentifier(node.openingElement.name)
		|| t.isJSXMemberExpression(node.openingElement.name));
};


export const getJSXElementName = (node: t.JSXElement): string => {
	const openingElement = node.openingElement;

	const name = t.isJSXIdentifier(openingElement.name)
		? openingElement.name.name
		: t.isJSXMemberExpression(openingElement.name)
			? t.isJSXIdentifier(openingElement.name.object)
				? openingElement.name.object.name + '.' + openingElement.name.property.name
				: ''
			: '';

	return name;
};


export const isJSXCustomElementComponent = (nodeOrName: t.JSXElement | string): boolean => {
	const tagName = typeof nodeOrName !== 'string'
		? getJSXElementName(nodeOrName)
		: nodeOrName;

	if (tagName.endsWith(COMPONENT_POSTFIX))
		return true;

	return false;
};


export const isJSXFunctionElementComponent = (nodeOrName: t.JSXElement | string): boolean => {
	const tagName = typeof nodeOrName !== 'string'
		? getJSXElementName(nodeOrName)
		: nodeOrName;

	if (!isComponent(tagName))
		return false;

	if (tagName.endsWith(COMPONENT_POSTFIX))
		return false;

	return true;
};
