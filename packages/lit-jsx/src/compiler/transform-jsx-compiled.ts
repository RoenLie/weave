import type { PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';

import {
	AttributeHandler,
	CompiledAttributeProcessor,
	CreateCompiledPart,
	type ProcessorContext,
} from './attribute-processor.ts';
import { CompiledBuilder, TemplateBuilder } from './builder.ts';
import {
	Ensure,
	ensureImports,
	getJSXElementName,
	getProgramFromPath,
	getTemplateType,
	isJSXElementStatic,
	isJSXFunctionElementComponent,
	isValidJSXElement,
} from './compiler-utils.ts';
import { ERROR_MESSAGES, WHITESPACE_TAGS } from './config.ts';
import { processTemplate, type TemplateContext } from './transform-jsx-template.ts';


export const transformJSXElementCompiled: VisitNode<
	PluginPass, t.JSXElement | t.JSXFragment
> = (path): void => {
	// If the parent is a JSX element, we do not need to transform it.
	// The below condition will handle the case where the JSX element
	// is nested inside another JSX element.
	if (t.isJSXElement(path.parent) || t.isJSXFragment(path.parent))
		return;

	path.replaceWith(processJSXElementToCompiled(path));
};


export interface CompiledContext extends ProcessorContext {
	builder:      CompiledBuilder;
	currentIndex: number;
}


export const processJSXElementToCompiled = (path: NodePath<t.JSXElement | t.JSXFragment>): t.Expression => {
	const program = getProgramFromPath(path);

	const context: CompiledContext = {
		program,
		path,
		currentIndex:     0,
		tagName:          '',
		isInitialElement: true,
		builder:          new CompiledBuilder(),
		importsUsed:      new Set([ 'taggedTemplateUtil' ]),
	};

	processCompiled(context);

	const compiledExpression = processCompiled.createCompiledExpression(context);

	ensureImports(context);

	return compiledExpression;
};


export const processCompiled = (context: CompiledContext): void => {
	if (t.isJSXFragment(context.path.node)) {
		context.builder.addText('');

		processCompiled.children(context);

		return;
	}

	context.tagName = getJSXElementName(context.path.node);

	if (isJSXFunctionElementComponent(context.tagName)) {
		// Process attributes and children into a props object
		if (!context.isInitialElement)
			processCompiled.processFunctionalComponent(context);

		// If this is the initial element, this should not happen.
		// and it should instead have been processed as a single expression.

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

processCompiled.attributes = (context: CompiledContext): void => {
	if (!isValidJSXElement(context.path))
		throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

	const { attributes } = context.path.node.openingElement;
	const processor = new CompiledAttributeProcessor();
	const handler = new AttributeHandler(processor);

	// Process the attributes
	for (const attr of attributes.values())
		handler.processAttribute(attr, context);
};

processCompiled.children = (context: CompiledContext): void => {
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

processCompiled.createFunctionalComponent = (path: NodePath<t.JSXElement | t.JSXFragment>): t.Expression => {
	const program = getProgramFromPath(path);

	const context: CompiledContext = {
		program,
		path,
		currentIndex:     0,
		tagName:          '',
		isInitialElement: true,
		builder:          new CompiledBuilder(),
		importsUsed:      new Set([ 'taggedTemplateUtil' ]),
	};

	if (!isValidJSXElement(context.path))
		throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

	const properties: (t.ObjectProperty | t.SpreadElement)[] = [];
	const attributes = context.path.node.openingElement.attributes;
	const tagName = getJSXElementName(context.path.node);

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
	if (context.path.node.children.length > 0) {
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

				const isStatic = isJSXElementStatic(childPath);
				const templateType = getTemplateType(childPath);

				if (isStatic || templateType !== 'html') {
					// Create a new builder for this child element
					const childContext: TemplateContext = {
						...context,
						literalName:      '',
						templateType:     'html',
						path:             childPath,
						builder:          new TemplateBuilder(),
						isInitialElement: false,
					};

					// Recursively process the child element
					processTemplate(childContext);

					// Get the tagged template expression from the child
					const childTemplate = processTemplate
						.createTaggedTemplate(childContext, isStatic, templateType);

					childrenArray.push(childTemplate);
				}
				else {
					// For compiled version, we need to process child elements differently
					// Create a new compiled builder for this child element
					const childContext: CompiledContext = {
						...context,
						path:             childPath,
						builder:          new CompiledBuilder(),
						currentIndex:     context.currentIndex + 1,
						isInitialElement: false,
					};

					processCompiled(childContext);

					const compiledExpression = processCompiled
						.createCompiledExpression(childContext);

					// Add the child expression to the array
					childrenArray.push(compiledExpression);
				}
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

	const expression = t.callExpression(
		t.identifier(tagName),
		[ t.objectExpression(properties) ],
	);

	return expression;
};

processCompiled.processFunctionalComponent = (context: CompiledContext): void => {
	const expression = processCompiled.createFunctionalComponent(context.path);

	context.builder.addText('<?>');
	context.builder.addValue(expression);
	context.builder.addPart(CreateCompiledPart.child(context.currentIndex + 1));
};

processCompiled.createCompiledExpression = (context: CompiledContext): t.ObjectExpression => {
	const variableName = context.path.scope.generateUid();
	const compiledTemplate = context.builder.createCompiledTemplate();
	const compiledExpression = context.builder.createExpression(variableName);

	Ensure.hoistAsTopLevelVariable(context.path, variableName, compiledTemplate);

	return compiledExpression;
};
