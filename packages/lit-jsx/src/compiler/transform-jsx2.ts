import type { PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';
import { PartType } from 'lit-html/directive.js';

import {
	AttrValidators,
	CompiledAttrProcessors,
	createChildPartEntry,
	Ensure,
	EnsureImport,
	getJSXElementName,
	isValidJSXElement,
} from './compiler-utils.ts';
import { ERROR_MESSAGES, WHITESPACE_TAGS } from './config.ts';


export const transformJSXElementCompiled: VisitNode<
	PluginPass, t.JSXElement
> = (path): void => {
	// If the parent is a JSX element, we do not need to transform it.
	// The below condition will handle the case where the JSX element
	// is nested inside another JSX element.
	if (t.isJSXElement(path.parent))
		return;

	const { compiledTemplate, createExpression } = processJSXElementToCompiled(path);

	const variableName = path.scope.generateUid();
	Ensure.hoistAsTopLevelVariable(path, variableName, compiledTemplate);

	path.replaceWith(createExpression(variableName));
};


export interface CompiledContext {
	program:      t.Program;
	path:         NodePath<t.JSXElement>;
	currentIndex: number;
	templateText: { value: string; };
	parts:        t.ObjectExpression[];
	values:       t.Expression[];
	partsUsed:    Set<PartType>;
	importsUsed:  Set<keyof typeof EnsureImport>;

}


const processJSXElementToCompiled = (path: NodePath<t.JSXElement>) => {
	const program = path.findParent(p => t.isProgram(p.node))?.node as t.Program | undefined;
	if (!program)
		throw new Error(ERROR_MESSAGES.NO_PROGRAM_FOUND);

	EnsureImport.taggedTemplateUtil(program, path);

	const data: CompiledContext = {
		program,
		path,
		currentIndex: 0,
		templateText: { value: '' },
		parts:        [],
		values:       [],
		partsUsed:    new Set(),
		importsUsed:  new Set(),
	};

	process(data);

	ensureImports(data);

	// Finalize the template text and parts
	const taggedTemplateExpression = t.taggedTemplateExpression(
		t.identifier('__$t'),
		t.templateLiteral([ t.templateElement({ raw: data.templateText.value }) ], []),
	);

	const compiledTemplate = t.objectExpression([
		t.objectProperty(t.stringLiteral('h'), taggedTemplateExpression),
		t.objectProperty(t.stringLiteral('parts'), t.arrayExpression(data.parts)),
	]);

	const createExpression = (variableName: string) => {
		return t.objectExpression([
			t.objectProperty(t.stringLiteral('_$litType$'), t.identifier(variableName)),
			t.objectProperty(t.stringLiteral('values'), t.arrayExpression(data.values)),
		]);
	};

	return {
		compiledTemplate,
		createExpression,
	};
};


const process = (context: CompiledContext) => {
	const tagName = getJSXElementName(context.path.node);
	// Process the opening tag
	context.templateText.value += '<' + tagName;

	const { attributes } = context.path.node.openingElement;

	// Process the attributes
	for (const attr of attributes.values()) {
		// Non expression attributes are checked before expression attributes.
		if (AttrValidators.isSpread(attr))
			CompiledAttrProcessors.spread(attr, context);
		else if (AttrValidators.isNonExpression(attr))
			CompiledAttrProcessors.nonExpression(attr, context);
		else if (AttrValidators.isBoolean(attr))
			CompiledAttrProcessors.boolean(attr, context);

		// Expression attributes are checked based on their type.
		// Order is based on a guess as to which expression is more common.
		else if (AttrValidators.isEvent(attr))
			CompiledAttrProcessors.event(attr, context);
		else if (AttrValidators.isArrowBinding(attr))
			CompiledAttrProcessors.arrowBinding(attr, context);
		else if (AttrValidators.isCallBinding(attr))
			CompiledAttrProcessors.callBinding(attr, context);
		else if (AttrValidators.isClassListBinding(attr))
			CompiledAttrProcessors.classList(attr, context);
		else if (AttrValidators.isStyleListBinding(attr))
			CompiledAttrProcessors.styleList(attr, context);
		else if (AttrValidators.isRef(attr))
			CompiledAttrProcessors.ref(attr, context);
		else if (AttrValidators.isDirective(attr))
			CompiledAttrProcessors.directive(attr, context);

		// Generic expression attributes are checked last
		// because this condition will be true for all expression attributes.
		// and we want the more specific cases to be checked first.
		else if (AttrValidators.isExpression(attr))
			CompiledAttrProcessors.expression(attr, context);
		else
			throw new Error(ERROR_MESSAGES.UNKNOWN_JSX_ATTRIBUTE_TYPE);
	}

	// Close the opening tag
	context.templateText.value += '>';

	// Process the children
	for (const [ index, child ] of context.path.node.children.entries()) {
		if (t.isJSXText(child)) {
			if (WHITESPACE_TAGS.includes(tagName))
				context.templateText.value += child.value;
			else
				context.templateText.value += child.value.trim();
		}
		else if (t.isJSXExpressionContainer(child)) {
			if (t.isJSXEmptyExpression(child.expression))
				continue;

			context.templateText.value += '<?>';

			context.values.push(child.expression);
			context.parts.push(createChildPartEntry(context.values.length));
			context.partsUsed.add(PartType.CHILD);
		}
		else if (t.isJSXElement(child)) {
			const path = context.path.get(`children.${ index }`);
			if (!isValidJSXElement(path))
				throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

			// Recursively process child elements
			// Index is incremented to ensure correct part indices.
			process({ ...context, path, currentIndex: context.currentIndex + 1 });
		}
	}

	// Process ending tag
	context.templateText.value += '</' + tagName + '>';
};


const ensureImports = (context: CompiledContext): void => {
	type Imports = Omit<typeof EnsureImport, 'prototype'>;
	const record = EnsureImport as Imports;

	// Ensure all imports used in the JSX element are imported.
	context.importsUsed.forEach((importName) => {
		const key = importName as keyof Imports;
		if (key in record)
			record[key](context.program, context.path);
	});
};
