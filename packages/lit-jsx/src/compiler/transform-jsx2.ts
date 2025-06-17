import type { PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';

import { Ensure } from './compiler-utils.ts';
import { ERROR_MESSAGES } from './config.ts';


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


const processJSXElementToCompiled = (initialPath: NodePath<t.JSXElement>) => {
	const program = initialPath.findParent(p => t.isProgram(p.node))?.node as t.Program | undefined;
	if (!program)
		throw new Error(ERROR_MESSAGES.NO_PROGRAM_FOUND);

	Ensure.taggedTemplateUtil(program, initialPath);

	const ttl = t.taggedTemplateExpression(
		t.identifier('__$t'),
		t.templateLiteral([ t.templateElement({ raw: '<h1>Hello <?></h1>' }) ], []),
	);

	const parts = t.arrayExpression([
		t.objectExpression([
			t.objectProperty(t.stringLiteral('type'), t.numericLiteral(2)),
			t.objectProperty(t.stringLiteral('index'), t.numericLiteral(1)),
		]),
	]);

	const compiledTemplate = t.objectExpression([
		t.objectProperty(t.stringLiteral('h'), ttl),
		t.objectProperty(t.stringLiteral('parts'), parts),
	]);

	const compiledExpr = t.objectExpression([
		t.objectProperty(t.stringLiteral('_$litType$'), compiledTemplate),
		t.objectProperty(t.stringLiteral('values'), t.arrayExpression([])),
	]);


	return compiledExpr;
};
