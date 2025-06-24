import type { PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';

import {
	AttributeHandler,
	CompiledAttributeProcessor,
	CreateCompiledPart,
	type ProcessorContext,
} from './attribute-processor.ts';
import { CompiledBuilder } from './builder.ts';
import {
	Ensure,
	EnsureImport,
	ensureImports,
	getJSXElementName,
	isJSXFunctionElementComponent,
	isValidJSXElement,
} from './compiler-utils.ts';
import { ERROR_MESSAGES, WHITESPACE_TAGS } from './config.ts';


export const transformJSXElementCompiled: VisitNode<
	PluginPass, t.JSXElement | t.JSXFragment
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


export interface CompiledContext extends ProcessorContext {
	currentIndex: number;
	builder:      CompiledBuilder;
}


const processJSXElementToCompiled = (path: NodePath<t.JSXElement | t.JSXFragment>, context?: CompiledContext) => {
	const program = path.findParent(p => t.isProgram(p.node))?.node as t.Program | undefined;
	if (!program)
		throw new Error(ERROR_MESSAGES.NO_PROGRAM_FOUND);

	EnsureImport.taggedTemplateUtil(program, path);

	context ??= {
		program,
		path,
		currentIndex:        0,
		tagName:             '',
		isComponentFunction: false,
		isInitialElement:    true,
		builder:             new CompiledBuilder(),
		importsUsed:         new Set(),
	};

	processCompiled(context);
	ensureImports(context);

	const compiledTemplate = context.builder.createCompiledTemplate();
	const createExpression = (variableName: string) =>
		context.builder.createExpression(variableName);

	return {
		compiledTemplate,
		createExpression,
	};
};


const processCompiled = (context: CompiledContext) => {
	if (t.isJSXFragment(context.path.node)) {
		context.builder.addText('');

		processCompiled.children(context);

		return;
	}

	context.tagName = getJSXElementName(context.path.node);

	if (isJSXFunctionElementComponent(context.tagName)) {
		context.isComponentFunction = true;

		// TODO, need to handle it if it's a top level functional component.
		// Then we should be able to just return the expression...
		// But there might be other implications.

		// Process attributes and children into a props object
		if (!context.isInitialElement)
			processCompiled.processFunctionalComponent(context);

		return;
	}

	// Process the opening tag
	context.builder.addText('<' + context.tagName);

	// Process the attributes
	processCompiled.attributes(context);

	// Close the opening tag
	context.builder.addText('>');

	// Process the children
	processCompiled.children(context);

	// Process ending tag
	context.builder.addText('</' + context.tagName + '>');
};

processCompiled.attributes = (context: CompiledContext) => {
	if (!isValidJSXElement(context.path))
		throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

	const { attributes } = context.path.node.openingElement;
	const processor = new CompiledAttributeProcessor();
	const handler = new AttributeHandler(processor);

	// Process the attributes
	for (const attr of attributes.values())
		handler.processAttribute(attr, context);
};

processCompiled.children = (context: CompiledContext) => {
	for (const childPath of context.path.get('children').values()) {
		const child = childPath.node;

		// Index is incremented to ensure correct part indices.
		const partIndex = context.currentIndex + 1;

		if (t.isJSXText(child)) {
			if (WHITESPACE_TAGS.includes(context.tagName))
				context.builder.addText(child.value);
			else
				context.builder.addText(child.value.trim());
		}
		else if (t.isJSXExpressionContainer(child)) {
			if (t.isJSXEmptyExpression(child.expression))
				throw new Error(ERROR_MESSAGES.EMPTY_EXPRESSION);

			context.builder.addText('<?>');
			context.builder.addValue(child.expression);
			context.builder.addPart(CreateCompiledPart.child(partIndex));
		}
		else if (t.isJSXElement(child)) {
			if (!isValidJSXElement(childPath))
				throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

			// Recursively process child elements
			processCompiled({
				...context,
				path:             childPath,
				currentIndex:     partIndex,
				isInitialElement: false,
			});
		}
	}
};

processCompiled.processFunctionalComponent = (context: CompiledContext): void => {
	if (!isValidJSXElement(context.path))
		throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

	const properties: (t.ObjectProperty | t.SpreadElement)[] = [];
	const attributes = context.path.node.openingElement.attributes;

	for (const attr of attributes) {
		// Handle spread attributes by spreading the object
		if (t.isJSXSpreadAttribute(attr)) {
			properties.push(t.spreadElement(attr.argument));

			continue;
		}

		const name = attr.name.name.toString();
		const camelCaseName = name
			.replace(/-([a-zA-Z])/g, (_, letter) => letter.toUpperCase());

		let value: t.Expression;

		if (attr.value) {
			if (t.isJSXExpressionContainer(attr.value)) {
				// If the expression is empty, skip it
				if (t.isJSXEmptyExpression(attr.value.expression))
					continue;

				value = attr.value.expression;
			}
			else if (t.isStringLiteral(attr.value)) {
				value = attr.value;
			}
			// Other literal types
			else {
				value = attr.value as t.Expression;
			}
		}
		else {
			// Boolean attribute (no value means true)
			value = t.booleanLiteral(true);
		}

		properties.push(t.objectProperty(t.identifier(camelCaseName), value));
	}

	// Process children
	const children = context.path.node.children;
	if (children.length > 0) {
		const childrenArray: t.Expression[] = [];

		for (const childPath of context.path.get('children')) {
			const child = childPath.node;

			if (t.isJSXText(child)) {
				const trimmedValue = child.value.trim();
				if (trimmedValue)
					childrenArray.push(t.stringLiteral(trimmedValue));
			}
			else if (t.isJSXExpressionContainer(child)) {
				if (t.isJSXEmptyExpression(child.expression))
					continue;

				childrenArray.push(child.expression);
			}
			else if (t.isJSXElement(child)) {
				if (!isValidJSXElement(childPath))
					throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

				// For compiled version, we need to process child elements differently
				// Create a new compiled builder for this child element
				const { compiledTemplate, createExpression } = processJSXElementToCompiled(
					childPath as NodePath<t.JSXElement>,
					{
						...context,
						path:             childPath,
						currentIndex:     context.currentIndex + 1,
						isInitialElement: false,
						builder:          new CompiledBuilder(),
					},
				);

				// Generate a unique variable name for this child template
				const childVariableName = context.path.scope.generateUid();
				Ensure.hoistAsTopLevelVariable(context.path, childVariableName, compiledTemplate);

				// Add the child expression to the array
				childrenArray.push(createExpression(childVariableName));
			}
		}

		// Add children property if there are any children
		if (childrenArray.length > 0) {
			// If there's only one child, we can use it directly.
			// If there are multiple children, we wrap them in an array.
			// This is because JSX Component Functions expects
			// either a single child or an array of children.
			const childrenValue: t.Expression = childrenArray.length === 1
				? childrenArray[0]!
				: t.arrayExpression(childrenArray);

			properties.push(t.objectProperty(
				t.identifier('children'),
				childrenValue,
			));
		}
	}

	// For compiled version, we need to add the component call as a compiled part
	const partIndex = context.currentIndex + 1;

	context.builder.addText('<?>');
	context.builder.addValue(
		t.callExpression(
			t.identifier(context.tagName),
			[ t.objectExpression(properties) ],
		),
	);
	context.builder.addPart(CreateCompiledPart.child(partIndex));
};
