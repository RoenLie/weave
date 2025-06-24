import { type PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';

import {
	AttributeHandler,
	type ProcessorContext,
	TemplateAttributeProcessor,
} from './attribute-processor.ts';
import { TemplateBuilder } from './builder.ts';
import {
	ensureImports,
	isJSXElementPath,
	isJSXFragmentPath,
	isValidOpeningElement,
	type Values,
} from './compiler-utils.ts';
import {
	Ensure,
	getJSXElementName,
	getTemplateType,
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


export const transformJSXElement: VisitNode<
	PluginPass, t.JSXElement | t.JSXFragment
> = (path): void => {
	// If the parent is a JSX element, we do not need to transform it.
	// The below condition will handle the case where the JSX element
	// is nested inside another JSX element.
	if (t.isJSXElement(path.parent) || t.isJSXFragment(path.parent))
		return;

	// If the parent is not a JSX element,
	// we need to wrap the JSX in a tagged template expression
	return void path.replaceWith(processTemplate(path));
};


export interface TemplateContext extends ProcessorContext {
	builder:            TemplateBuilder;
	isStatic:           { value: boolean; };
	literalName:        string;
	isComponentTag:     boolean;
	isCustomElementTag: boolean;
	templateType:       Values<Pick<typeof VARIABLES, 'HTML' | 'SVG' | 'MATHML'>>;
}


const createTemplateContext = (
	path:                NodePath<t.JSXElement | t.JSXFragment>,
	program:             t.Program,
	builder:             TemplateBuilder,
): TemplateContext => {
	return {
		program,
		builder,
		path,
		isStatic:            { value: false },
		isComponentTag:      false,
		isCustomElementTag:  false,
		isComponentFunction: false,
		isInitialElement:    true,
		literalName:         '',
		tagName:             '',
		templateType:        'html',
		importsUsed:         new Set(),
	} satisfies TemplateContext;
};


const processTemplate = (path: NodePath<t.JSXElement | t.JSXFragment>) => {
	const program = path.findParent(p => t.isProgram(p.node))?.node as t.Program | undefined;
	if (!program)
		throw new Error(ERROR_MESSAGES.NO_PROGRAM_FOUND);


	const builder = new TemplateBuilder();
	const context = createTemplateContext(path, program, builder);

	processTemplate.processOpeningTag(context);

	const taggedTemplate = processTemplate.createTaggedTemplate(context);

	ensureImports(context);

	return taggedTemplate;
};

processTemplate.processOpeningTag = (
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
	context.templateType = getTemplateType(name);

	if (isJSXCustomElementComponent(context.tagName)) {
		context.isCustomElementTag = true;
		context.isStatic.value = true;
		context.isComponentTag = true;

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
		context.isComponentFunction = true;

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
				processTemplate.processOpeningTag({
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
	if (context.isCustomElementTag) {
		context.builder.addText('</');
		context.builder.addExpression(t.identifier(context.literalName));
		context.builder.addText('>');
	}
	else {
		context.builder.addText('</' + context.tagName + '>');
	}
};

processTemplate.processFunctionalComponent = (context: TemplateContext): void => {
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

				// Create a new builder for this child element
				const childBuilder = new TemplateBuilder();
				const childContext: TemplateContext = {
					...context,
					path:             childPath,
					builder:          childBuilder,
					isInitialElement: false,
				};

				// Recursively process the child element
				processTemplate.processOpeningTag(childContext);

				// Get the tagged template expression from the child
				const childTemplate = processTemplate
					.createTaggedTemplate(childContext);

				childrenArray.push(childTemplate);
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

	context.builder.addText('');
	context.builder.addExpression(
		t.callExpression(
			t.identifier(context.tagName),
			[ t.objectExpression(properties) ],
		),
	);
	context.builder.addText('');
};

processTemplate.createTaggedTemplate = (context: TemplateContext): t.TaggedTemplateExpression => {
	let identifier: string = '';

	if (context.isStatic.value) {
		if (context.templateType === VARIABLES.HTML) {
			identifier = VARIABLES.HTML_STATIC;
			context.importsUsed.add('htmlStatic');
		}
		// This will not happen, as svg and mathml dynamic tags are not supported yet.
		else if (context.templateType === VARIABLES.SVG) {
			identifier = VARIABLES.SVG_STATIC;
			context.importsUsed.add('svgStatic');
		}
		// This will not happen, as svg and mathml dynamic tags are not supported yet.
		else if (context.templateType === VARIABLES.MATHML) {
			identifier = VARIABLES.MATHML_STATIC;
			context.importsUsed.add('mathmlStatic');
		}
		else {
			throw new Error(ERROR_MESSAGES.UNKNOWN_TEMPLATE_TYPE(context.templateType));
		}
	}
	else {
		if (context.templateType === VARIABLES.HTML) {
			identifier = VARIABLES.HTML;
			context.importsUsed.add('html');
		}
		else if (context.templateType === VARIABLES.SVG) {
			identifier = VARIABLES.SVG;
			context.importsUsed.add('svg');
		}
		else if (context.templateType === VARIABLES.MATHML) {
			identifier = VARIABLES.MATHML;
			context.importsUsed.add('mathml');
		}
		else {
			throw new Error(ERROR_MESSAGES.UNKNOWN_TEMPLATE_TYPE(context.templateType));
		}
	}

	return context.builder.createTaggedTemplate(identifier);
};
