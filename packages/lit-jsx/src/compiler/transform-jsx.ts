import { type PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';

import {
	EnsureImport,
	isJSXElementPath,
	isJSXFragmentPath,
	isValidOpeningElement,
	type Values,
} from './compiler-utils.ts';
import {
	AttrProcessors,
	AttrValidators,
	Ensure,
	getJSXElementName,
	getTemplateType,
	isJSXCustomElementComponent,
	isJSXFunctionElementComponent,
	isValidJSXElement,
	TemplateBuilder,
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
	return void path.replaceWith(processJSXElement(path));
};


export interface JSXElementContext {
	path:                NodePath<t.JSXElement | t.JSXFragment>;
	program:             t.Program;
	builder:             TemplateBuilder;
	isStatic:            { value: boolean; };
	literalName:         string;
	tagName:             string;
	isComponentTag:      boolean;
	isCustomElementTag:  boolean;
	isComponentFunction: boolean;
	templateType:        Values<Pick<typeof VARIABLES, 'HTML' | 'SVG' | 'MATHML'>>;
	importsUsed:         Set<Omit<keyof typeof EnsureImport, 'prototype'>>;
}


const createJSXElementContext = (
	path:                NodePath<t.JSXElement | t.JSXFragment>,
	program:             t.Program,
	builder:             TemplateBuilder,
): JSXElementContext => {
	return {
		program,
		builder,
		path,
		isStatic:            { value: false },
		isComponentTag:      false,
		isCustomElementTag:  false,
		isComponentFunction: false,
		literalName:         '',
		tagName:             '',
		templateType:        'html',
		importsUsed:         new Set(),
	} satisfies JSXElementContext;
};


const processJSXElement = (path: NodePath<t.JSXElement | t.JSXFragment>) => {
	const program = path.findParent(p => t.isProgram(p.node))?.node as t.Program | undefined;
	if (!program)
		throw new Error(ERROR_MESSAGES.NO_PROGRAM_FOUND);


	const builder = new TemplateBuilder();
	const context = createJSXElementContext(path, program, builder);

	processJSXElement.processOpeningTag(context);

	const taggedTemplate = processJSXElement.createTaggedTemplate(context);

	processJSXElement.ensureImports(context);

	return taggedTemplate;
};

processJSXElement.processOpeningTag = (
	context: JSXElementContext,
): void => {
	if (t.isJSXFragment(context.path.node)) {
		context.builder.addText('');

		processJSXElement.processChildren(context);

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

		processJSXElement.processAttributes(context);
		processJSXElement.processChildren(context);
		processJSXElement.processClosingTag(context);

		return;
	}

	if (isJSXFunctionElementComponent(context.tagName)) {
		context.isComponentFunction = true;

		// Process attributes and children into a props object
		const propsObject = processJSXElement.createComponentPropsObject(context);

		context.builder.addText('');
		context.builder.addExpression(
			t.callExpression(
				t.identifier(context.tagName),
				[ propsObject ],
			),
		);
		context.builder.addText('');

		return;
	}

	// If the tag is not a component, we will treat it as a regular HTML element.
	context.builder.addText('<' + context.tagName);

	processJSXElement.processAttributes(context);
	processJSXElement.processChildren(context);
	processJSXElement.processClosingTag(context);

	return;
};

processJSXElement.processAttributes = (context: JSXElementContext): void => {
	if (!isValidJSXElement(context.path))
		throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

	const { attributes } = context.path.node.openingElement;

	for (const attr of attributes.values()) {
		// Non expression attributes are checked before expression attributes.
		if (AttrValidators.isSpread(attr))
			AttrProcessors.spread(attr, context);
		else if (AttrValidators.isNonExpression(attr))
			AttrProcessors.nonExpression(attr, context);
		else if (AttrValidators.isBoolean(attr))
			AttrProcessors.boolean(attr, context);

		// Expression attributes are checked based on their type.
		// Order is based on a guess as to which expression is more common.
		else if (AttrValidators.isEvent(attr))
			AttrProcessors.event(attr, context);
		else if (AttrValidators.isArrowBinding(attr))
			AttrProcessors.arrowBinding(attr, context);
		else if (AttrValidators.isCallBinding(attr))
			AttrProcessors.callBinding(attr, context);
		else if (AttrValidators.isClassListBinding(attr))
			AttrProcessors.classList(attr, context);
		else if (AttrValidators.isStyleListBinding(attr))
			AttrProcessors.styleList(attr, context);
		else if (AttrValidators.isRef(attr))
			AttrProcessors.ref(attr, context);
		else if (AttrValidators.isDirective(attr))
			AttrProcessors.directive(attr, context);

		// Generic expression attributes are checked last
		// because this condition will be true for all expression attributes.
		// and we want the more specific cases to be checked first.
		else if (AttrValidators.isExpression(attr))
			AttrProcessors.expression(attr, context);
		else
			throw new Error(ERROR_MESSAGES.UNKNOWN_JSX_ATTRIBUTE_TYPE);
	}

	context.builder.addText('>'); // Close the opening tag
};

processJSXElement.processChildren = (context: JSXElementContext): void => {
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
			if (isJSXElementPath(currentPath) || isJSXFragmentPath(currentPath))
				processJSXElement.processOpeningTag({ ...context, path: currentPath });
		}
	}
};

processJSXElement.processClosingTag = (context: JSXElementContext): void => {
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

processJSXElement.createComponentPropsObject = (context: JSXElementContext): t.ObjectExpression => {
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

		for (const [ index, child ] of children.entries()) {
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
				const childPath = context.path.get(`children.${ index }`);

				if (!isValidOpeningElement(childPath))
					throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

				// Create a new builder for this child element
				const childBuilder = new TemplateBuilder();
				const childContext: JSXElementContext = {
					...context,
					path:    childPath,
					builder: childBuilder,
				};

				// Recursively process the child element
				processJSXElement.processOpeningTag(childContext);

				// Get the tagged template expression from the child
				const childTemplate = processJSXElement
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

	return t.objectExpression(properties);
};

processJSXElement.createTaggedTemplate = (context: JSXElementContext): t.TaggedTemplateExpression => {
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

processJSXElement.ensureImports = (context: JSXElementContext): void => {
	type Imports = Omit<typeof EnsureImport, 'prototype'>;
	const record = EnsureImport as Imports;

	// Ensure all imports used in the JSX element are imported.
	context.importsUsed.forEach((importName) => {
		const key = importName as keyof Imports;
		if (key in record)
			record[key](context.program, context.path);
	});
};


/**
 * Determines if a JSX element will result in a static template.
 * This function traverses the JSX tree to check if any custom element components
 * are present, which would make the template static.
 *
 * @param path - The NodePath of the JSX element to analyze
 * @returns true if the template will be static, false otherwise
 */
export const isJSXElementStatic = (path: NodePath<t.JSXElement | t.JSXFragment>): boolean => {
	if (t.isJSXElement(path.node) && isJSXCustomElementComponent(path.node))
		return true;

	for (const index of path.node.children.keys()) {
		const childPath = path.get(`children.${ index }`);

		if (isJSXElementPath(childPath) && isJSXElementStatic(childPath))
			return true;
		else if (isJSXFragmentPath(childPath) && isJSXElementStatic(childPath))
			return true;
	}

	return false;
};
