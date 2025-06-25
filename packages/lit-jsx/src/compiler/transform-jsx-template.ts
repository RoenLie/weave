import { type PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';

import {
	AttributeHandler,
	type ProcessorContext,
	TemplateAttributeProcessor,
} from './attribute-processor.ts';
import { CompiledBuilder, TemplateBuilder } from './builder.ts';
import {
	ensureImports,
	getProgramFromPath,
	getTemplateType,
	isJSXElementPath,
	isJSXElementStatic,
	isJSXFragmentPath,
	isValidOpeningElement,
	type TemplateType,
	type Values,
} from './compiler-utils.ts';
import {
	Ensure,
	getJSXElementName,
	isJSXCustomElementComponent,
	isJSXFunctionElementComponent,
	isValidJSXElement,
} from './compiler-utils.ts';
import {
	COMPONENT_LITERAL_PREFIX,
	ERROR_MESSAGES,
	VARIABLES,
	WHITESPACE_TAGS,
} from './config.ts';
import { type CompiledContext, processCompiled } from './transform-jsx-compiled.ts';


export const transformJSXElementTemplate: VisitNode<
	PluginPass, t.JSXElement | t.JSXFragment
> = (path): void => {
	// If the parent is a JSX element, we do not need to transform it.
	// The below condition will handle the case where the JSX element
	// is nested inside another JSX element.
	if (t.isJSXElement(path.parent) || t.isJSXFragment(path.parent))
		return;

	// If the parent is not a JSX element,
	// we need to wrap the JSX in a tagged template expression
	return void path.replaceWith(processJSXElementToTemplate(path));
};


export interface TemplateContext extends ProcessorContext {
	builder:      TemplateBuilder;
	literalName:  string;
	templateType: Values<Pick<typeof VARIABLES, 'HTML' | 'SVG' | 'MATHML'>>;
}


export const processJSXElementToTemplate = (path: NodePath<t.JSXElement | t.JSXFragment>): t.Expression => {
	const program = getProgramFromPath(path);

	const context: TemplateContext = {
		program,
		path,
		isInitialElement: true,
		literalName:      '',
		tagName:          '',
		templateType:     'html',
		builder:          new TemplateBuilder(),
		importsUsed:      new Set(),
	};

	const isStatic = isJSXElementStatic(context.path);
	const templateType = getTemplateType(path);

	processTemplate(context);

	const taggedTemplate = processTemplate.createTaggedTemplate(context, isStatic, templateType);

	ensureImports(context);

	return taggedTemplate;
};


export const processTemplate = (
	context: TemplateContext,
): void => {
	if (t.isJSXFragment(context.path.node)) {
		context.builder.addText('');

		processTemplate.processChildren(context);

		return;
	}

	const name = getJSXElementName(context.path.node);
	if (!name)
		throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

	context.tagName = name;

	if (isJSXCustomElementComponent(context.tagName)) {
		const literalIdentifier = Ensure.componentLiteral(
			context.tagName,
			COMPONENT_LITERAL_PREFIX + context.tagName,
			context.path,
			context.program,
		);

		context.literalName = literalIdentifier.name;

		context.builder.addText('<');
		context.builder.addExpression(literalIdentifier);

		processTemplate.processAttributes(context);
		processTemplate.processChildren(context);
		processTemplate.processClosingTag(context);

		return;
	}

	if (isJSXFunctionElementComponent(context.tagName)) {
		// Process attributes and children into a props object
		processTemplate.processFunctionalComponent(context);

		return;
	}

	// If the tag is not a component, we will treat it as a regular HTML element.
	context.builder.addText('<' + context.tagName);

	processTemplate.processAttributes(context);
	processTemplate.processChildren(context);
	processTemplate.processClosingTag(context);

	return;
};

processTemplate.processAttributes = (context: TemplateContext): void => {
	if (!isValidJSXElement(context.path))
		throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

	const { attributes } = context.path.node.openingElement;

	const processor = new TemplateAttributeProcessor();
	const handler = new AttributeHandler(processor);

	for (const attr of attributes.values())
		handler.processAttribute(attr, context);

	// Close the opening tag
	context.builder.addText('>');
};

processTemplate.processChildren = (context: TemplateContext): void => {
	for (const [ index, child ] of context.path.node.children.entries()) {
		if (t.isJSXText(child)) {
			if (WHITESPACE_TAGS.includes(context.tagName))
				context.builder.addText(child.value);
			else
				context.builder.addText(child.value.trim());
		}
		else if (t.isJSXExpressionContainer(child)) {
			if (t.isJSXEmptyExpression(child.expression))
				continue;

			context.builder.addExpression(child.expression);
		}
		else if (t.isJSXElement(child)) {
			const currentPath = context.path.get(`children.${ index }`);

			// Recursively process child elements
			if (isJSXElementPath(currentPath) || isJSXFragmentPath(currentPath)) {
				processTemplate({
					...context,
					path:             currentPath,
					isInitialElement: false,
				});
			}
		}
	}
};

processTemplate.processClosingTag = (context: TemplateContext): void => {
	// If it's a component tag, we need to close it with the static literal.
	if (context.literalName) {
		context.builder.addText('</');
		context.builder.addExpression(t.identifier(context.literalName));
		context.builder.addText('>');
	}
	else {
		context.builder.addText('</' + context.tagName + '>');
	}
};

processTemplate.createFunctionalComponent = (path: NodePath<t.JSXElement | t.JSXFragment>) => {
	const program = getProgramFromPath(path);

	const context: TemplateContext = {
		program,
		path,
		isInitialElement: true,
		literalName:      '',
		tagName:          '',
		templateType:     'html',
		builder:          new TemplateBuilder(),
		importsUsed:      new Set(),
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

		const childrenPaths = context.path.get(`children`);
		for (const childPath of childrenPaths) {
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
				if (!isValidOpeningElement(childPath))
					throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

				const isStatic = isJSXElementStatic(childPath);
				const templateType = getTemplateType(childPath);

				if (isStatic || templateType !== 'html') {
					// Create a new builder for this child element
					const childContext: TemplateContext = {
						...context,
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
						currentIndex:     0,
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


processTemplate.processFunctionalComponent = (context: TemplateContext): void => {
	const expression = processTemplate.createFunctionalComponent(context.path);

	context.builder.addText('');
	context.builder.addExpression(expression);
	context.builder.addText('');

	return;
};

processTemplate.createTaggedTemplate = (
	context: TemplateContext,
	isStatic: boolean,
	templateType: TemplateType,
): t.TaggedTemplateExpression => {
	let identifier: string = '';

	if (isStatic) {
		if (templateType === VARIABLES.HTML) {
			identifier = VARIABLES.HTML_STATIC;
			context.importsUsed.add('htmlStatic');
		}
		// This will not happen, as svg and mathml dynamic tags are not supported yet.
		else if (templateType === VARIABLES.SVG) {
			identifier = VARIABLES.SVG_STATIC;
			context.importsUsed.add('svgStatic');
		}
		// This will not happen, as svg and mathml dynamic tags are not supported yet.
		else if (templateType === VARIABLES.MATHML) {
			identifier = VARIABLES.MATHML_STATIC;
			context.importsUsed.add('mathmlStatic');
		}
		else {
			throw new Error(ERROR_MESSAGES.UNKNOWN_TEMPLATE_TYPE(templateType));
		}
	}
	else {
		if (templateType === VARIABLES.HTML) {
			identifier = VARIABLES.HTML;
			context.importsUsed.add('html');
		}
		else if (templateType === VARIABLES.SVG) {
			identifier = VARIABLES.SVG;
			context.importsUsed.add('svg');
		}
		else if (templateType === VARIABLES.MATHML) {
			identifier = VARIABLES.MATHML;
			context.importsUsed.add('mathml');
		}
		else {
			throw new Error(ERROR_MESSAGES.UNKNOWN_TEMPLATE_TYPE(templateType));
		}
	}

	return context.builder.createTaggedTemplate(identifier);
};
