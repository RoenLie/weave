import { type PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';

import type { AttrExpressionParams, AttrNonExpressionParams, AttrSpreadParams, Values } from './compiler-utils.ts';
import { attributeProcessors, determineTemplateType, ensure, isComponent, TemplateBuilder } from './compiler-utils.ts';
import {
	ATTR_NAMES, ATTR_VALUES, COMPONENT_LITERAL_PREFIX, DISCARD_TAG,
	ERROR_MESSAGES, SPECIAL_TAGS, VARIABLES, WHITESPACE_TAGS,
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


interface JSXElementContext {
	initialPath:         NodePath<t.JSXElement>;
	currentPath:         NodePath<t.JSXElement>;
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
	const openingElementId = initialPath.node.openingElement.name;
	if (!t.isJSXIdentifier(openingElementId))
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
) => {
	const openingElement = initialContext.currentPath.node.openingElement;

	if (!t.isJSXIdentifier(openingElement.name))
		throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

	const context: JSXElementContext = Object.assign(initialContext, {
		isComponentTag:      false,
		isCustomElementTag:  false,
		isComponentFunction: false,
		literalName:         '',
		tagName:             openingElement.name.name,
		templateType:        determineTemplateType(openingElement.name.name),
	} satisfies Omit<JSXElementContext, keyof InitialJSXElementContext>);

	// If the tag name is `DISCARD_TAG`, we skip it.
	// but we still need to process its children.
	if (context.tagName !== DISCARD_TAG) {
		// eslint-disable-next-line no-cond-assign
		if (context.isComponentTag = isComponent(context.tagName)) {
			if (context.tagName.endsWith('_')) {
				context.isCustomElementTag = true;
				context.isStatic.value = true; // Custom elements are always static.

				// If it's a component, we will use lit static html function to wrap this parent.
				// then we create a static literal for the tag name at the top of the file.
				// and use that static literal in the template.
				// This will allow us to use the component as a tag name.

				const literalIdentifier = ensure.componentLiteral(
					context.tagName,
					COMPONENT_LITERAL_PREFIX + context.tagName,
					context.currentPath,
					context.program,
				);

				context.literalName = literalIdentifier.name;

				context.builder.addText('<');
				context.builder.addExpression(literalIdentifier);
			}
			// We have a few special Component tags which are library level components.
			// These we will need to do special handling dependant on which special component it is.
			else if (SPECIAL_TAGS.includes(context.tagName)) {
				// For - should compile into a map() directive.
				// If - should compile into a when() directive.
			}
			else {
				context.isComponentFunction = true;

				// If it's a component function, we will instead of creating a wrapping tag element for it
				// we will wrap it in an expression, take the attributes and children and pass them as an object to
				// the component function.
				// where the attributes are passed by their name->value, and the children are passed to the children property.
				context.builder.addText('');
			}
		}
		else {
			context.builder.addText('<' + context.tagName);
		}

		if (!context.isComponentFunction) {
			transformTopLevelJSXElement.processAttributes(context);
			transformTopLevelJSXElement.processChildren(context);
			transformTopLevelJSXElement.processClosingTag(context);
		}
		else {
			//
			// If it's a component function, we need to process the attributes and children
			// and pass them as an object to the component function.
		}
	}
	else {
		//
		transformTopLevelJSXElement.processChildren(context);
		transformTopLevelJSXElement.processClosingTag(context);
	}

	return context;
};

transformTopLevelJSXElement.processAttributes = (context: JSXElementContext): void => {
	const attributes = context.currentPath.node.openingElement.attributes;

	for (const [ index, attr ] of attributes.entries()) {
		if (t.isJSXSpreadAttribute(attr)) {
			const expression = attr.argument;

			// If the spread attribute calls a reserved function, we will instead
			// assign the value of the function as an element directive.
			if (
				t.isCallExpression(expression)
				&& t.isIdentifier(expression.callee)
				&& expression.callee.name === ATTR_VALUES.DIRE
			) {
				const params: AttrSpreadParams = {
					builder: context.builder,
					attr:    attr as AttrSpreadParams['attr'],
					path:    context.currentPath,
					index,
					program: context.program,
				};

				attributeProcessors.asDire(params);
			}
			else {
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
			}

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

				if (name === ATTR_NAMES.CLASS_LIST) {
					attributeProcessors.classList(params);
				}
				else if (name === ATTR_NAMES.STYLE_LIST) {
					attributeProcessors.styleList(params);
				}
				else if (name.startsWith(ATTR_NAMES.EVENT_PREFIX)) {
					attributeProcessors.event(params);
				}
				else if (name === ATTR_NAMES.REF) {
					attributeProcessors.ref(params);
				}
				// To support being able to set expression container values as attributes and booleans.
				// we check to see if the expression is calling a predefined function.
				else if (t.isCallExpression(expression) && t.isIdentifier(expression.callee)) {
					if (expression.callee.name === ATTR_VALUES.PROP)
						attributeProcessors.asProp(params);
					else if (expression.callee.name === ATTR_VALUES.ATTR)
						attributeProcessors.asAttr(params);
					else if (expression.callee.name === ATTR_VALUES.BOOL)
						attributeProcessors.asBool(params);
					else if (expression.callee.name === ATTR_VALUES.DEFINED)
						attributeProcessors.asAttr(params);
					else
						attributeProcessors.expression(params);
				}
				else {
					attributeProcessors.expression(params);
				}

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

/** Returns true if the template is static. */
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
			const childPath = context.currentPath
				.get(`children.${ index }`) as NodePath<t.JSXElement>;

			// Recursively process child elements
			transformTopLevelJSXElement.processOpeningTag({
				...context,
				currentPath: childPath,
			});

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
	// If the tag is `DISCARD_TAG` we skip, as we did not add the opening tag.
	if (context.tagName === DISCARD_TAG) { /*  */ }
	// Add closing tag.
	else {
		// If it's a component tag, we need to close it with the static literal.
		if (context.isComponentTag) {
			context.builder.addText('</');
			context.builder.addExpression(t.identifier(context.literalName));
			context.builder.addText('>');
		}
		else {
			context.builder.addText('</' + context.tagName + '>');
		}
	}
};
