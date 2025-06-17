import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

import { isMathmlTag } from '../shared/mathml-tags.ts';
import { isSvgTag } from '../shared/svg-tags.ts';
import {
	ATTR_BIND_OBJ_NAME, ATTR_NAMES, ATTR_VALUES,
	COMPONENT_POSTFIX, ERROR_MESSAGES, SOURCES, VARIABLES,
} from './config.ts';

export type Values<T> = T[keyof T];


export const isComponent = (tagName: string): boolean => {
	return (tagName[0] && tagName[0].toLowerCase() !== tagName[0])
		|| tagName.includes('.')
		|| /[^a-zA-Z]/.test(tagName[0] ?? '');
};

export const getTemplateType = (
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


export interface AttrParams {
	builder: TemplateBuilder;
	program: t.Program;
	path:    NodePath<t.JSXElement>;
	index:   number;
}

interface CallBindingAttribute extends t.JSXAttribute {
	value: t.JSXExpressionContainer & {
		expression: t.CallExpression & {
			callee: t.MemberExpression & {
				object:   t.Identifier;
				property: t.Identifier;
			};
			arguments: [ t.Expression ];
		};
	};
}

interface ArrowFunctionAttribute extends t.JSXAttribute {
	value: t.JSXExpressionContainer & {
		expression: t.ArrowFunctionExpression & {
			params: [ t.Identifier & { name: Values<typeof ATTR_VALUES>; } ];
			body:   t.Expression;
		};
	};
}

interface JSXAttributeWithExpression extends t.JSXAttribute {
	value: t.JSXExpressionContainer & {
		expression: t.Expression;
	};
}

interface JSXAttributeWithoutExpression extends t.JSXAttribute {
	value: Exclude<t.JSXAttribute['value'], t.JSXExpressionContainer>;
}

interface JSXAttributeBoolean extends t.JSXAttribute {
	value: null | undefined;
}


export class AttrValidators {

	static isCallBinding(attr: t.JSXAttribute): attr is CallBindingAttribute {
		if (!this.isExpression(attr))
			return false;

		const expression = attr.value.expression;

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
	}

	static isArrowBinding(attr: t.JSXAttribute): attr is ArrowFunctionAttribute {
		if (!this.isExpression(attr))
			return false;

		const expression = attr.value.expression;

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
	}

	static isDirective(attr: t.JSXAttribute): attr is JSXAttributeWithExpression {
		return this.isExpression(attr) && attr.name.name.toString() === ATTR_NAMES.DIRECTIVE;
	}

	static isRef(attr: t.JSXAttribute): attr is JSXAttributeWithExpression {
		return this.isExpression(attr) && attr.name.name.toString() === ATTR_NAMES.REF;
	}

	static isClassListBinding(attr: t.JSXAttribute): attr is JSXAttributeWithExpression {
		return this.isExpression(attr) && attr.name.name.toString() === VARIABLES.CLASS_MAP;
	}

	static isStyleListBinding(attr: t.JSXAttribute): attr is JSXAttributeWithExpression {
		return this.isExpression(attr) && attr.name.name.toString() === ATTR_NAMES.STYLE_LIST;
	}

	static isEvent(attr: t.JSXAttribute): attr is JSXAttributeWithExpression {
		return attr.name.name.toString().startsWith(ATTR_NAMES.EVENT_PREFIX);
	}

	static isExpression(attr: t.JSXAttribute): attr is JSXAttributeWithExpression  {
		return t.isJSXExpressionContainer(attr.value)
			&& t.isExpression(attr.value.expression);
	};

	static isNonExpression(attribute: t.JSXAttribute): attribute is JSXAttributeWithoutExpression {
		return !!attribute.value && !t.isJSXExpressionContainer(attribute.value);
	};

	static isSpread(attr: t.JSXAttribute | t.JSXSpreadAttribute): attr is t.JSXSpreadAttribute {
		return t.isJSXSpreadAttribute(attr);
	}

	static isBoolean(attr: t.JSXAttribute): attr is JSXAttributeBoolean {
		return !attr.value;
	}

}


export class AttrProcessors {

	static callBinding(attr: CallBindingAttribute, options: AttrParams): void {
		const expression = attr.value.expression;
		const isProp = expression.callee.property.name === ATTR_VALUES.PROP;
		const isBool = expression.callee.property.name === ATTR_VALUES.BOOL;

		if (isProp)
			options.builder.addText(' .');
		else if (isBool)
			options.builder.addText(' ?');
		else
			throw new Error(ERROR_MESSAGES.INVALID_DIRECTIVE_VALUE);

		const name = attr.name.name.toString();
		const argument = expression.arguments[0];

		options.builder.addText(name + '=');
		options.builder.addExpression(argument);
	}

	static arrowBinding(attr: ArrowFunctionAttribute, options: AttrParams): void {
		const expression = attr.value.expression;
		const param = expression.params[0];
		const isProp = param.name === ATTR_VALUES.PROP;
		const isBool = param.name === ATTR_VALUES.BOOL;

		if (isProp)
			options.builder.addText(' .');
		else if (isBool)
			options.builder.addText(' ?');
		else
			throw new Error(ERROR_MESSAGES.INVALID_DIRECTIVE_VALUE);

		const name = attr.name.name.toString();
		const expressionBody = expression.body;

		options.builder.addText(name + '=');
		options.builder.addExpression(expressionBody);
	}

	static directive(attr: JSXAttributeWithExpression, options: AttrParams): void {
		// Replace the spread attribute with its argument, minus the compiler func.
		const expression = attr.value.expression;
		if (t.isCallExpression(expression)) {
			// If the expression is a call, we can add it directly.
			options.builder.addText(' ');
			options.builder.addExpression(expression);
		}
		else if (t.isArrayExpression(expression)) {
			for (const item of expression.elements) {
				if (!t.isExpression(item))
					throw new Error(ERROR_MESSAGES.EMPTY_JSX_EXPRESSION);

				// Add a space to keep correct spacing in the template.
				options.builder.addText(' ');
				options.builder.addExpression(item);
			}
		}
		else {
			throw new Error(ERROR_MESSAGES.INVALID_DIRECTIVE_VALUE);
		}
	}

	static ref(attr: JSXAttributeWithExpression, options: AttrParams): void {
		// add a ref call around the expression.
		const expression = t.callExpression(
			t.identifier(VARIABLES.REF),
			[ attr.value.expression ],
		);

		// add a space to keep correct spacing in the template.
		options.builder.addText(' ');
		options.builder.addExpression(expression);

		Ensure.createRefImport(options.program, options.path);
	}

	static classList(attr: JSXAttributeWithExpression, options: AttrParams): void {
		// add a classMap call around the expression.
		const expression = t.callExpression(
			t.identifier(VARIABLES.CLASS_MAP),
			[ attr.value.expression ],
		);

		// add classlist without the . to the quasi.
		options.builder.addText(' class=');
		options.builder.addExpression(expression);

		Ensure.classMapImport(options.program, options.path);
	}

	static styleList(attr: JSXAttributeWithExpression, options: AttrParams): void {
		const name = attr.name.name.toString();

		// add a styleMap call around the expression.
		const expression = t.callExpression(
			t.identifier(VARIABLES.STYLE_MAP),
			[ attr.value.expression ],
		);

		options.builder.addText(' ' + name + '=');
		options.builder.addExpression(expression);

		Ensure.styleMapImport(options.program, options.path);
	}

	static event(attr: JSXAttributeWithExpression, options: AttrParams): void {
		// If the attribute is an event handler,
		// we need to convert it to a standard DOM event name.
		const oldName = attr.name.name.toString();
		const newName = '@' + oldName.slice(3);
		options.builder.addText(' ' + newName + '=');
		options.builder.addExpression(attr.value.expression);
	}

	static expression(attr: JSXAttributeWithExpression, options: AttrParams): void {
		// Any other attribute which has an expression container value
		const name = attr.name.name.toString();
		options.builder.addText(' ' + name + '=');
		options.builder.addExpression(attr.value.expression);
	}

	static nonExpression(attribute: JSXAttributeWithoutExpression, options: AttrParams): void {
		// If the value is a string, we can use it directly
		// Here we always bind the value as a string.
		// In the future, we might want to also support numbers.
		if (!t.isStringLiteral(attribute.value))
			throw new Error(ERROR_MESSAGES.ONLY_STRING_LITERALS);

		const name = attribute.name.name.toString();
		const value = attribute.value.value;
		options.builder.addText(' ' + name + '="' + value + '"');
	};

	static spread(attribute: t.JSXSpreadAttribute, options: AttrParams): void {
		// If it's a spread attribute, we wrap it in our custom
		// `rest` directive.
		// This will allow us to handle the spread attribute correctly.
		// We also need to ensure that the `rest` directive is imported.
		Ensure.restImport(options.program, options.path);

		//const attrPath = options.path
		//	.get(`openingElement.attributes.${ options.index }.argument`);

		const newExpression = t.callExpression(
			t.identifier(VARIABLES.REST),
			[ attribute.argument ],
		);

		//attrPath.replaceWith(newExpression);

		options.builder.addText(' ');
		options.builder.addExpression(newExpression);
	}

	static boolean(attribute: JSXAttributeBoolean, options: AttrParams): void {
		// If the value is null or undefined, we can bind the attribute name directly.
		// This will result in a attribute without a value, e.g. `<div disabled>`.
		const name = attribute.name.name.toString();
		options.builder.addText(' ' + name);
	};

}


export class Ensure {

	static import(
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
	}

	static htmlImport(program: t.Program, path: NodePath): void {
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
	}

	static htmlStaticImport(program: t.Program, path: NodePath): void {
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
	}

	static svgImport(program: t.Program, path: NodePath): void {
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
	}

	static svgStaticImport(program: t.Program, path: NodePath): void {
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
	}

	static mathmlImport(program: t.Program, path: NodePath): void {
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
	}

	static mathmlStaticImport(program: t.Program, path: NodePath): void {
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
	}

	static unsafeStaticImport(program: t.Program, path: NodePath): void {
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
	}

	static createRefImport(program: t.Program, path: NodePath): void {
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
	}

	static styleMapImport(program: t.Program, path: NodePath): void {
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
	}

	static classMapImport(program: t.Program, path: NodePath): void {
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
	}

	static restImport(program: t.Program, path: NodePath): void {
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
	}

	static literalMapImport(program: t.Program, path: NodePath): void {
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
	}

	static componentTagDeclaration(
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
	}

	static componentLiteral(
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
	}

	static taggedTemplateUtil(program: t.Program, path: NodePath): void {
		this.import(
			(source) => source === 'jsx-lit',
			(name) => name === '__$t',
			() => t.importDeclaration(
				[ t.importSpecifier(t.identifier('__$t'), t.identifier('__$t')) ],
				t.stringLiteral('jsx-lit'),
			),
			program,
			path,
		);
	}

}


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
