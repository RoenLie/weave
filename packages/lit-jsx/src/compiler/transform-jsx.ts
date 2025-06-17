import { type PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';

import type { AttrParams, ValidJSXElement, Values } from './compiler-utils.ts';
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
	COMPONENT_LITERAL_PREFIX, DISCARD_TAG,
	ERROR_MESSAGES, VARIABLES, WHITESPACE_TAGS,
} from './config.ts';


export const transformJSXFragment: VisitNode<
	PluginPass, t.JSXFragment
> = (path): void => {
	// If it's a JSX fragment, we replace it with a JSX element
	// with a `DISCARD_TAG`, which will be handled later.
	// this lets us strip the fragment without losing its children.
	const discardWrapper = t.jSXElement(
		t.jSXOpeningElement(t.jSXIdentifier(DISCARD_TAG), [], false),
		t.jSXClosingElement(t.jSXIdentifier(DISCARD_TAG)),
		path.node.children,
		false,
	);

	return void path.replaceWith(discardWrapper);
};


export const transformJSXElement: VisitNode<
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
		processJSXElement(path),
	);
};


interface JSXElementContext {
	initialPath:         NodePath<ValidJSXElement>;
	currentPath:         NodePath<ValidJSXElement>;
	program:             t.Program;
	builder:             TemplateBuilder;
	literalName:         string;
	tagName:             string;
	isComponentTag:      boolean;
	isCustomElementTag:  boolean;
	isComponentFunction: boolean;
	isStatic:            { value: boolean; };
	templateType:        Values<Pick<typeof VARIABLES, 'HTML' | 'SVG' | 'MATHML'>>;
}

type InitialJSXElementContext = Pick<
	JSXElementContext,
	'initialPath' | 'currentPath' | 'program' | 'builder' | 'isStatic'
>;


const processJSXElement = (initialPath: NodePath<t.JSXElement>) => {
	const program = initialPath.findParent(p => t.isProgram(p.node))?.node as t.Program | undefined;
	if (!program)
		throw new Error(ERROR_MESSAGES.NO_PROGRAM_FOUND);

	return processJSXElement.transform(initialPath, program);
};

processJSXElement.transform = (
	initialPath: NodePath<t.JSXElement>,
	program: t.Program,
): t.TaggedTemplateExpression => {
	if (!isValidJSXElement(initialPath))
		throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

	const builder = new TemplateBuilder();
	const initialContext: InitialJSXElementContext = {
		program,
		builder,
		initialPath,
		currentPath: initialPath,
		isStatic:    { value: false },
	};

	const context = processJSXElement.processOpeningTag(initialContext);

	return processJSXElement.createTaggedTemplate(context);
};

processJSXElement.createTaggedTemplate = (
	context: JSXElementContext,
) => {
	let identifier: string = '';

	if (context.isStatic.value) {
		if (context.templateType === VARIABLES.HTML) {
			identifier = VARIABLES.HTML_STATIC;
			Ensure.htmlStaticImport(context.program, context.initialPath);
		}
		// This will not happen, as svg and mathml dynamic tags are not supported yet.
		else if (context.templateType === VARIABLES.SVG) {
			identifier = VARIABLES.SVG_STATIC;
			Ensure.svgStaticImport(context.program, context.initialPath);
		}
		// This will not happen, as svg and mathml dynamic tags are not supported yet.
		else if (context.templateType === VARIABLES.MATHML) {
			identifier = VARIABLES.MATHML_STATIC;
			Ensure.mathmlStaticImport(context.program, context.initialPath);
		}
		else {
			throw new Error(ERROR_MESSAGES.UNKNOWN_TEMPLATE_TYPE(context.templateType));
		}
	}
	else {
		if (context.templateType === VARIABLES.HTML) {
			identifier = VARIABLES.HTML;
			Ensure.htmlImport(context.program, context.initialPath);
		}
		else if (context.templateType === VARIABLES.SVG) {
			identifier = VARIABLES.SVG;
			Ensure.svgImport(context.program, context.initialPath);
		}
		else if (context.templateType === VARIABLES.MATHML) {
			identifier = VARIABLES.MATHML;
			Ensure.mathmlImport(context.program, context.initialPath);
		}
		else {
			throw new Error(ERROR_MESSAGES.UNKNOWN_TEMPLATE_TYPE(context.templateType));
		}
	}

	return context.builder.createTaggedTemplate(identifier);
};

processJSXElement.processOpeningTag = (
	initialContext: InitialJSXElementContext,
): JSXElementContext => {
	const name = getJSXElementName(initialContext.currentPath.node);
	if (!name)
		throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

	const context: JSXElementContext = Object.assign(initialContext, {
		isComponentTag:      false,
		isCustomElementTag:  false,
		isComponentFunction: false,
		literalName:         '',
		tagName:             name,
		templateType:        getTemplateType(name),
	} satisfies Omit<JSXElementContext, keyof InitialJSXElementContext>);

	// If the tag name is `DISCARD_TAG`, we skip it.
	// but we still need to process its children.
	if (context.tagName === DISCARD_TAG) {
		context.builder.addText('');

		processJSXElement.processChildren(context);

		return context;
	}

	if (isJSXCustomElementComponent(context.tagName)) {
		context.isCustomElementTag = true;
		context.isStatic.value = true;
		context.isComponentTag = true;

		const literalIdentifier = Ensure.componentLiteral(
			context.tagName,
			COMPONENT_LITERAL_PREFIX + context.tagName,
			context.currentPath,
			context.program,
		);

		context.literalName = literalIdentifier.name;

		context.builder.addText('<');
		context.builder.addExpression(literalIdentifier);

		processJSXElement.processAttributes(context);
		processJSXElement.processChildren(context);
		processJSXElement.processClosingTag(context);

		return context;
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

		return context;
	}

	// If the tag is not a component, we will treat it as a regular HTML element.
	context.builder.addText('<' + context.tagName);

	processJSXElement.processAttributes(context);
	processJSXElement.processChildren(context);
	processJSXElement.processClosingTag(context);

	return context;
};

processJSXElement.processAttributes = (
	context: JSXElementContext,
): void => {
	const { attributes } = context.currentPath.node.openingElement;

	for (const [ index, attr ] of attributes.entries()) {
		const params: AttrParams = {
			builder: context.builder,
			path:    context.currentPath,
			program: context.program,
			index,
		};

		// Non expression attributes are checked before expression attributes.
		if (AttrValidators.isSpread(attr))
			AttrProcessors.spread(attr, params);
		else if (AttrValidators.isNonExpression(attr))
			AttrProcessors.nonExpression(attr, params);
		else if (AttrValidators.isBoolean(attr))
			AttrProcessors.boolean(attr, params);

		// Expression attributes are checked based on their type.
		// Order is based on a guess as to which expression is more common.
		else if (AttrValidators.isEvent(attr))
			AttrProcessors.event(attr, params);
		else if (AttrValidators.isArrowBinding(attr))
			AttrProcessors.arrowBinding(attr, params);
		else if (AttrValidators.isCallBinding(attr))
			AttrProcessors.callBinding(attr, params);
		else if (AttrValidators.isClassListBinding(attr))
			AttrProcessors.classList(attr, params);
		else if (AttrValidators.isStyleListBinding(attr))
			AttrProcessors.styleList(attr, params);
		else if (AttrValidators.isRef(attr))
			AttrProcessors.ref(attr, params);
		else if (AttrValidators.isDirective(attr))
			AttrProcessors.directive(attr, params);

		// Generic expression attributes are checked last
		// because this condition will be true for all expression attributes.
		// and we want the more specific cases to be checked first.
		else if (AttrValidators.isExpression(attr))
			AttrProcessors.expression(attr, params);
		else
			throw new Error(ERROR_MESSAGES.UNKNOWN_JSX_ATTRIBUTE_TYPE);
	}

	context.builder.addText('>'); // Close the opening tag
};

processJSXElement.processChildren = (
	context: JSXElementContext,
) => {
	for (const [ index, child ] of context.currentPath.node.children.entries()) {
		if (t.isJSXText(child)) {
			if (WHITESPACE_TAGS.includes(context.tagName))
				context.builder.addText(child.value);
			else
				context.builder.addText(child.value.trim());

			continue;
		}
		if (t.isJSXElement(child)) {
			const currentPath = context.currentPath.get(`children.${ index }`);
			if (!isValidJSXElement(currentPath))
				throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

			// Recursively process child elements
			processJSXElement.processOpeningTag({ ...context, currentPath });

			continue;
		}
		if (t.isJSXExpressionContainer(child)) {
			if (t.isJSXEmptyExpression(child.expression))
				continue;

			context.builder.addExpression(child.expression);
			continue;
		}
	}
};

processJSXElement.processClosingTag = (
	context: JSXElementContext,
): void => {
	// Add closing tag.
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

processJSXElement.createComponentPropsObject = (
	context: JSXElementContext,
): t.ObjectExpression => {
	const properties: (t.ObjectProperty | t.SpreadElement)[] = [];
	const attributes = context.currentPath.node.openingElement.attributes;

	// Process attributes
	for (const attr of attributes) {
		if (t.isJSXSpreadAttribute(attr)) {
			// Handle spread attributes by spreading the object
			properties.push(t.spreadElement(attr.argument));

			continue;
		}

		const name = attr.name.name.toString();
		const camelCaseName = name.replace(/-([a-zA-Z])/g, (_, letter) => letter.toUpperCase());

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
			else {
				// Other literal types
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
	const children = context.currentPath.node.children;
	if (children.length > 0) {
		const childrenArray: t.Expression[] = [];

		for (const [ index, child ] of children.entries()) {
			if (t.isJSXText(child)) {
				const trimmedValue = child.value.trim();
				if (trimmedValue)
					childrenArray.push(t.stringLiteral(trimmedValue));

				continue;
			}

			if (t.isJSXElement(child)) {
				const childPath = context.currentPath.get(`children.${ index }`);
				if (!isValidJSXElement(childPath))
					throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

				// Create a new builder for this child element
				const childBuilder = new TemplateBuilder();
				const childContext: JSXElementContext = {
					...context,
					currentPath: childPath,
					builder:     childBuilder,
				};

				// Recursively process the child element
				processJSXElement
					.processOpeningTag(childContext);

				// Get the tagged template expression from the child
				const childTemplate = processJSXElement
					.createTaggedTemplate(childContext);

				childrenArray.push(childTemplate);

				continue;
			}

			if (t.isJSXExpressionContainer(child)) {
				if (t.isJSXEmptyExpression(child.expression))
					continue;

				childrenArray.push(child.expression);
				continue;
			}
		}

		// Add children property if there are any children
		if (childrenArray.length > 0) {
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
