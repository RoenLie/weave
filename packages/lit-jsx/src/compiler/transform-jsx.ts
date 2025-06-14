import { type PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';

import type { AttrArrowExpressionParams, AttrExpressionParams, AttrMemberExpressionParams, AttrNonExpressionParams, Values } from './compiler-utils.ts';
import { attributeProcessors, determineTemplateType, ensure, isArrowFunctionBinding, isCallExpressionBinding, isComponent, TemplateBuilder } from './compiler-utils.ts';
import {
	ATTR_NAMES,  COMPONENT_LITERAL_PREFIX, COMPONENT_POSTFIX, DISCARD_TAG,
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
		transformTopLevelJSXElement(path),
	);
};


type ValidJSXElement = t.JSXElement & {
	openingElement: t.JSXOpeningElement & {
		name: t.JSXIdentifier | t.JSXMemberExpression;
	};
};

const isValidJSXElement = (initialPath: NodePath): initialPath is NodePath<ValidJSXElement> => {
	const node = initialPath.node;

	return t.isJSXElement(node)
		&& t.isJSXOpeningElement(node.openingElement)
		&& (t.isJSXIdentifier(node.openingElement.name)
		|| t.isJSXMemberExpression(node.openingElement.name));
};

const getJSXElementName = (node: t.JSXElement): string => {
	const openingElement = node.openingElement;

	const name = t.isJSXIdentifier(openingElement.name)
		? openingElement.name.name
		: t.isJSXMemberExpression(openingElement.name)
			? t.isJSXIdentifier(openingElement.name.object)
				? openingElement.name.object.name + '.' + openingElement.name.property.name
				: ''
			: '';

	return name;
};

const isJSXCustomElementComponent = (nodeOrName: t.JSXElement | string): boolean => {
	const tagName = typeof nodeOrName !== 'string'
		? getJSXElementName(nodeOrName)
		: nodeOrName;

	if (tagName.endsWith(COMPONENT_POSTFIX))
		return true;

	return false;
};

const isJSXFunctionElementComponent = (nodeOrName: t.JSXElement | string) => {
	const tagName = typeof nodeOrName !== 'string'
		? getJSXElementName(nodeOrName)
		: nodeOrName;

	if (!isComponent(tagName))
		return false;

	if (tagName.endsWith(COMPONENT_POSTFIX))
		return false;

	return true;
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


const transformTopLevelJSXElement = (initialPath: NodePath<t.JSXElement>) => {
	const program = initialPath.findParent(p => t.isProgram(p.node))?.node as t.Program | undefined;
	if (!program)
		throw new Error(ERROR_MESSAGES.NO_PROGRAM_FOUND);

	return transformTopLevelJSXElement.transform(initialPath, program);
};

transformTopLevelJSXElement.transform = (
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

	const context = transformTopLevelJSXElement.processOpeningTag(initialContext);

	return transformTopLevelJSXElement.createTaggedTemplate(context);
};

transformTopLevelJSXElement.createTaggedTemplate = (context: JSXElementContext) => {
	let identifier: string = '';

	if (context.isStatic.value) {
		if (context.templateType === VARIABLES.HTML) {
			identifier = VARIABLES.HTML_STATIC;
			ensure.htmlStaticImport(context.program, context.initialPath);
		}
		// This will not happen, as svg and mathml dynamic tags are not supported yet.
		else if (context.templateType === VARIABLES.SVG) {
			identifier = VARIABLES.SVG_STATIC;
			ensure.svgStaticImport(context.program, context.initialPath);
		}
		// This will not happen, as svg and mathml dynamic tags are not supported yet.
		else if (context.templateType === VARIABLES.MATHML) {
			identifier = VARIABLES.MATHML_STATIC;
			ensure.mathmlStaticImport(context.program, context.initialPath);
		}
		else {
			throw new Error(ERROR_MESSAGES.UNKNOWN_TEMPLATE_TYPE(context.templateType));
		}
	}
	else {
		if (context.templateType === VARIABLES.HTML) {
			identifier = VARIABLES.HTML;
			ensure.htmlImport(context.program, context.initialPath);
		}
		else if (context.templateType === VARIABLES.SVG) {
			identifier = VARIABLES.SVG;
			ensure.svgImport(context.program, context.initialPath);
		}
		else if (context.templateType === VARIABLES.MATHML) {
			identifier = VARIABLES.MATHML;
			ensure.mathmlImport(context.program, context.initialPath);
		}
		else {
			throw new Error(ERROR_MESSAGES.UNKNOWN_TEMPLATE_TYPE(context.templateType));
		}
	}

	return context.builder.createTaggedTemplate(identifier);
};

transformTopLevelJSXElement.processOpeningTag = (
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
		templateType:        determineTemplateType(name),
	} satisfies Omit<JSXElementContext, keyof InitialJSXElementContext>);

	// If the tag name is `DISCARD_TAG`, we skip it.
	// but we still need to process its children.
	if (context.tagName === DISCARD_TAG) {
		context.builder.addText('');

		transformTopLevelJSXElement.processChildren(context);

		return context;
	}

	if (isJSXCustomElementComponent(context.tagName)) {
		context.isCustomElementTag = true;
		context.isStatic.value = true;
		context.isComponentTag = true;

		const literalIdentifier = ensure.componentLiteral(
			context.tagName,
			COMPONENT_LITERAL_PREFIX + context.tagName,
			context.currentPath,
			context.program,
		);

		context.literalName = literalIdentifier.name;

		context.builder.addText('<');
		context.builder.addExpression(literalIdentifier);

		transformTopLevelJSXElement.processAttributes(context);
		transformTopLevelJSXElement.processChildren(context);
		transformTopLevelJSXElement.processClosingTag(context);

		return context;
	}

	if (isJSXFunctionElementComponent(context.tagName)) {
		// If it's a component function, we will instead of creating a wrapping tag element for it
		// we will wrap it in an expression, take the attributes and children and pass them as an object to
		// the component function.
		// where the attributes are passed by their name->value, and the children are passed to the children property.
		context.isComponentFunction = true;

		// Process attributes and children into a props object
		const propsObject = transformTopLevelJSXElement.createComponentPropsObject(context);

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

	transformTopLevelJSXElement.processAttributes(context);
	transformTopLevelJSXElement.processChildren(context);
	transformTopLevelJSXElement.processClosingTag(context);

	return context;
};

transformTopLevelJSXElement.processAttributes = (context: JSXElementContext): void => {
	const attributes = context.currentPath.node.openingElement.attributes;

	for (const [ index, attr ] of attributes.entries()) {
		if (t.isJSXSpreadAttribute(attr)) {
			// If it's a spread attribute, we wrap it in our custom
			// `rest` directive.
			// This will allow us to handle the spread attribute correctly.
			// We also need to ensure that the `rest` directive is imported.
			ensure.restImport(context.program, context.currentPath);

			const attrPath = context.currentPath
				.get(`openingElement.attributes.${ index }.argument`);

			const newExpression = t.callExpression(
				t.identifier(VARIABLES.REST),
				[ attr.argument ],
			);
			attrPath.replaceWith(newExpression);

			context.builder.addText(' ');
			context.builder.addExpression(newExpression);

			continue;
		}

		const name = attr.name.name.toString();
		if (attr.value) {
			if (t.isJSXExpressionContainer(attr.value)) {
				// If the expression is empty, we can skip it.
				// This should not happen in valid JSX.
				if (t.isJSXEmptyExpression(attr.value.expression))
					throw new Error(ERROR_MESSAGES.EMPTY_JSX_EXPRESSION);

				const expression = attr.value.expression;
				const params: AttrExpressionParams = {
					builder: context.builder,
					attr:    attr as AttrExpressionParams['attr'],
					path:    context.currentPath,
					index,
					program: context.program,
				};

				// If the attribute is classList, we bind it as a classMap directive.
				if (name === ATTR_NAMES.CLASS_LIST)
					attributeProcessors.classList(params);
				// If the attribute is styleList, we bind it as a styleMap directive.
				else if (name === ATTR_NAMES.STYLE_LIST)
					attributeProcessors.styleList(params);
				// If the attribute uses the event binding prefix,
				// we bind it as an event listener.
				else if (name.startsWith(ATTR_NAMES.EVENT_PREFIX))
					attributeProcessors.event(params);
				// If the attribute is ref we bind it as a ref directive.
				else if (name === ATTR_NAMES.REF)
					attributeProcessors.ref(params);
				// If the attribute is directive, we bind the values it as element directives.
				else if (name === ATTR_NAMES.DIRECTIVE)
					attributeProcessors.directive(params);
				// If the expression in the expression container is a function call,
				// we check if it is a valid bind expression.
				else if (isArrowFunctionBinding(expression))
					attributeProcessors.arrowBinding(params as AttrArrowExpressionParams);
				// If the expression in the expression container is a member expression
				// we check if it is a valid bind expression.
				else if (isCallExpressionBinding(expression))
					attributeProcessors.callBinding(params as AttrMemberExpressionParams);
				else
					// If no other explicit handling, bind it as an attribute.
					attributeProcessors.expression(params);

				continue;
			}

			attributeProcessors.nonExpression({
				builder: context.builder,
				attr:    attr as AttrNonExpressionParams['attr'],
				path:    context.currentPath,
				index,
				program: context.program,
			});

			continue;
		}

		// If the attribute has no value, we can add it as a boolean attribute.
		context.builder.addText(' ' + name);
	}

	context.builder.addText('>'); // Close the opening tag
};

transformTopLevelJSXElement.processChildren = (context: JSXElementContext) => {
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
			transformTopLevelJSXElement.processOpeningTag({ ...context, currentPath });

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

transformTopLevelJSXElement.processClosingTag = (context: JSXElementContext): void => {
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

transformTopLevelJSXElement.createComponentPropsObject = (context: JSXElementContext): t.ObjectExpression => {
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

		properties.push(t.objectProperty(
			t.identifier(name),
			value,
		));
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
				transformTopLevelJSXElement.processOpeningTag(childContext);

				// Get the tagged template expression from the child
				const childTemplate = transformTopLevelJSXElement.createTaggedTemplate(childContext);
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
