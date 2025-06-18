import type { PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';
import { PartType } from 'lit-html/directive.js';

import { Ensure, EnsureImport, getJSXElementName, isValidJSXElement } from './compiler-utils.ts';
import { ERROR_MESSAGES, WHITESPACE_TAGS } from './config.ts';


export const transformJSXElementCompiled: VisitNode<
	PluginPass, t.JSXElement
> = (path): void => {
	// If the parent is a JSX element, we do not need to transform it.
	// The below condition will handle the case where the JSX element
	// is nested inside another JSX element.
	if (t.isJSXElement(path.parent))
		return;

	// If the parent is not a JSX element,
	// we need to wrap the JSX in a tagged template expression
	return void path.replaceWith(
		processJSXElementToCompiled(path),
	);
};


interface CompiledContext {
	program:      t.Program;
	path:         NodePath<t.JSXElement>;
	templateText: { value: string; };
	parts:        t.ObjectExpression[];
	values:       t.Expression[];
	partsUsed:    Set<PartType>;
}


const processJSXElementToCompiled = (path: NodePath<t.JSXElement>) => {
	const program = path.findParent(p => t.isProgram(p.node))?.node as t.Program | undefined;
	if (!program)
		throw new Error(ERROR_MESSAGES.NO_PROGRAM_FOUND);

	EnsureImport.taggedTemplateUtil(program, path);

	const data: CompiledContext = {
		program,
		path,
		templateText: { value: '' },
		parts:        [],
		values:       [],
		partsUsed:    new Set<PartType>(),
	};

	process(data);

	// Finalize the template text and parts
	const ttl = t.taggedTemplateExpression(
		t.identifier('__$t'),
		t.templateLiteral([ t.templateElement({ raw: data.templateText.value }) ], []),
	);

	const compiledTemplate = t.objectExpression([
		t.objectProperty(t.stringLiteral('h'), ttl),
		t.objectProperty(t.stringLiteral('parts'), t.arrayExpression(data.parts)),
	]);

	const compiledExpr = t.objectExpression([
		t.objectProperty(t.stringLiteral('_$litType$'), compiledTemplate),
		t.objectProperty(t.stringLiteral('values'), t.arrayExpression(data.values)),
	]);

	return compiledExpr;
};


const process = (context: CompiledContext) => {
	const tagName = getJSXElementName(context.path.node);
	// Process the opening tag
	context.templateText.value += '<' + tagName + '>';

	const { attributes } = context.path.node.openingElement;

	// Process the attributes
	for (const attr of attributes.values()) {
		//
		attr;
	}

	// Process the children
	for (const [ index, child ] of context.path.node.children.entries()) {
		if (t.isJSXText(child)) {
			console.log(`Text found in JSX: ${ child.value }`);
			if (WHITESPACE_TAGS.includes(tagName))
				context.templateText.value += child.value;
			else
				context.templateText.value += child.value.trim();
		}
		else if (t.isJSXExpressionContainer(child) && !t.isJSXEmptyExpression(child.expression)) {
			console.log(`Expression found in JSX: ${ child.expression.type }`);
			context.templateText.value += '<?>';

			context.values.push(createValuesEntry(child.expression));
			context.parts.push(createChildPartEntry(context.values.length));
			context.partsUsed.add(PartType.CHILD);
		}
		else if (t.isJSXElement(child)) {
			const path = context.path.get(`children.${ index }`);
			if (!isValidJSXElement(path))
				throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

			// Recursively process child elements
			process({ ...context, path });
		}
	}

	// Process ending tag
	context.templateText.value += '</' + tagName + '>';
};


const createPartsEntry = (type: number, index: number): t.ObjectExpression => {
	return t.objectExpression([
		t.objectProperty(t.stringLiteral('type'), t.numericLiteral(type)),
		t.objectProperty(t.stringLiteral('index'), t.numericLiteral(index)),
	]);
};


const createValuesEntry = (value: t.Expression): t.Expression => {
	return value;
};


const createChildPartEntry = (index: number): t.ObjectExpression => {
	return createPartsEntry(PartType.CHILD, index);
};
