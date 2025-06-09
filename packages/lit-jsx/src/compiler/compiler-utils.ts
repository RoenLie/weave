import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

import { ERROR_MESSAGES, SOURCES, VARIABLES } from './config.ts';

export type Values<T> = T[keyof T];


export const isComponent = (tagName: string): boolean => {
	return (tagName[0] && tagName[0].toLowerCase() !== tagName[0])
		|| tagName.includes('.')
		|| /[^a-zA-Z]/.test(tagName[0] ?? '');
};


export class TemplateBuilder {

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
		if (this.currentQuasi || (this.expressions.length === 0 && this.quasis.length === 0))
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
	attr:    unknown;
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

export interface AttrNonExpressionParams extends AttrParams {
	attr:    t.JSXAttribute & {
		value: Exclude<t.JSXAttribute['value'], t.JSXExpressionContainer>;
	};
}

export const attributeProcessors = {
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
	nonExpression(params: AttrNonExpressionParams): void {
		// If the value is a string, we can use it directly
		// Here we always bind the value as a string.
		// In the future, we might want to also support numbers.
		if (!t.isStringLiteral(params.attr.value))
			throw new Error(ERROR_MESSAGES.ONLY_STRING_LITERALS);

		const name = params.attr.name.name.toString();
		params.builder.addText(' ' + name + '="' + params.attr.value.value + '"');
	},
} as const;


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
} as const;
