import type { PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';

import {
	AttributeHandler,
	CompiledAttributeProcessor,
	CreateCompiledPart,
} from './attribute-processor.ts';
import { CompiledBuilder } from './compiled-builder.ts';
import {
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
	builder:      CompiledBuilder;

}


const processJSXElementToCompiled = (path: NodePath<t.JSXElement>) => {
	const program = path.findParent(p => t.isProgram(p.node))?.node as t.Program | undefined;
	if (!program)
		throw new Error(ERROR_MESSAGES.NO_PROGRAM_FOUND);

	EnsureImport.taggedTemplateUtil(program, path);

	const context: CompiledContext = {
		program,
		path,
		currentIndex: 0,
		builder:      new CompiledBuilder(),
	};

	process(context);

	context.builder.ensureImports(context);

	const compiledTemplate = context.builder.createCompiledTemplate();
	const createExpression = (variableName: string) =>
		context.builder.createExpression(variableName);

	return {
		compiledTemplate,
		createExpression,
	};
};


const process = (context: CompiledContext) => {
	const tagName = getJSXElementName(context.path.node);

	// Process the opening tag
	context.builder.addText('<' + tagName);

	const { attributes } = context.path.node.openingElement;
	const processor = new CompiledAttributeProcessor();
	const handler = new AttributeHandler(processor);

	// Process the attributes
	for (const attr of attributes.values())
		handler.processAttribute(attr, context);

	// Close the opening tag
	context.builder.addText('>');

	//const children = context.path.get(`children`);
	//children.forEach(child => child.node)

	// Process the children
	for (const [ index, child ] of context.path.node.children.entries()) {
		const partIndex = context.currentIndex + 1;

		if (t.isJSXText(child)) {
			if (WHITESPACE_TAGS.includes(tagName))
				context.builder.addText(child.value);
			else
				context.builder.addText(child.value.trim());
		}
		else if (t.isJSXExpressionContainer(child)) {
			if (t.isJSXEmptyExpression(child.expression))
				continue;

			context.builder.addText('<?>');
			context.builder.addValue(child.expression);
			context.builder.addPart(CreateCompiledPart.child(partIndex));
		}
		else if (t.isJSXElement(child)) {
			const path = context.path.get(`children.${ index }`);
			if (!isValidJSXElement(path))
				throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

			// Recursively process child elements
			// Index is incremented to ensure correct part indices.
			process({ ...context, path, currentIndex: partIndex });
		}
	}

	// Process ending tag
	context.builder.addText('</' + tagName + '>');
};
