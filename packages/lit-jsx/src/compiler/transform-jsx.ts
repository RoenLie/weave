import { type PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';

import { isMathmlTag } from '../shared/mathml-tags.ts';
import { isSvgTag } from '../shared/svg-tags.ts';
import type { AttrExpressionParams, AttrNonExpressionParams, Values } from './compiler-utils.ts';
import { attributeProcessors, ensure, isComponent, TemplateBuilder } from './compiler-utils.ts';
import {
	ATTRIBUTES, COMPONENT_LITERAL_PREFIX, DISCARD_TAG,
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
	const isStatic = transformTopLevelJSXElement.process(initialPath, program, builder);
	const templateType = transformTopLevelJSXElement.determineTemplateType(openingElementId.name);

	return transformTopLevelJSXElement.createTaggedTemplate(initialPath, program, builder, templateType, isStatic);
};

transformTopLevelJSXElement.determineTemplateType = (
	tagName: string,
): Values<Pick<typeof VARIABLES, 'HTML' | 'SVG' | 'MATHML'>> => {
	if (isSvgTag(tagName))
		return VARIABLES.SVG;

	if (isMathmlTag(tagName))
		return VARIABLES.MATHML;

	return VARIABLES.HTML;
};

transformTopLevelJSXElement.createTaggedTemplate = (
	initialPath: NodePath<t.JSXElement>,
	program: t.Program,
	builder: TemplateBuilder,
	templateType: Values<Pick<typeof VARIABLES, 'HTML' | 'SVG' | 'MATHML'>>,
	isStatic: boolean,
) => {
	let identifier: string = '';

	if (isStatic) {
		if (templateType === VARIABLES.HTML) {
			identifier = VARIABLES.HTML_STATIC;
			ensure.htmlStaticImport(program, initialPath);
		}
		// This will not happen, as svg and mathml dynamic tags are not supported yet.
		else if (templateType === VARIABLES.SVG) {
			identifier = VARIABLES.SVG_STATIC;
			ensure.svgStaticImport(program, initialPath);
		}
		// This will not happen, as svg and mathml dynamic tags are not supported yet.
		else if (templateType === VARIABLES.MATHML) {
			identifier = VARIABLES.MATHML_STATIC;
			ensure.mathmlStaticImport(program, initialPath);
		}
		else {
			throw new Error(ERROR_MESSAGES.UNKNOWN_TEMPLATE_TYPE(templateType));
		}
	}
	else {
		if (templateType === VARIABLES.HTML) {
			identifier = VARIABLES.HTML;
			ensure.htmlImport(program, initialPath);
		}
		else if (templateType === VARIABLES.SVG) {
			identifier = VARIABLES.SVG;
			ensure.svgImport(program, initialPath);
		}
		else if (templateType === VARIABLES.MATHML) {
			identifier = VARIABLES.MATHML;
			ensure.mathmlImport(program, initialPath);
		}
		else {
			throw new Error(ERROR_MESSAGES.UNKNOWN_TEMPLATE_TYPE(templateType));
		}
	}

	return builder.createTaggedTemplate(identifier);
};

/** Returns true if the template is static. */
transformTopLevelJSXElement.process = (
	path: NodePath<t.JSXElement>,
	program: t.Program,
	builder: TemplateBuilder,
): boolean => {
	let { literalName, tagName, isComponentTag, isStatic } =
		transformTopLevelJSXElement.processOpeningTag(path, program, builder);

	if (transformTopLevelJSXElement.processChildren(path, program, builder, tagName, isStatic))
		isStatic = true;

	transformTopLevelJSXElement.processClosingTag(tagName, isComponentTag, literalName, builder);

	return isStatic;
};

transformTopLevelJSXElement.processOpeningTag = (
	path: NodePath<t.JSXElement>,
	program: t.Program,
	builder: TemplateBuilder,
) => {
	const openingElement = path.node.openingElement;

	if (!t.isJSXIdentifier(openingElement.name))
		throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

	const tagName:      string  = openingElement.name.name;
	let isComponentTag: boolean = false;
	let isStatic:       boolean = false;
	let literalName:    string  = '';

	// If the tag name is `DISCARD_TAG`, we skip it.
	// but we still need to process its children.
	if (tagName !== DISCARD_TAG) {
		// eslint-disable-next-line no-cond-assign
		if (isStatic = isComponentTag = isComponent(tagName)) {
			// If it's a component, we will use lit static html function to wrap this parent.
			// then we create a static literal for the tag name at the top of the file.
			// and use that static literal in the template.
			// This will allow us to use the component as a tag name.

			const literalIdentifier = ensure.componentLiteral(
				tagName, COMPONENT_LITERAL_PREFIX + tagName, path, program,
			);

			literalName = literalIdentifier.name;

			builder.addText('<');
			builder.addExpression(literalIdentifier);
		}
		else {
			builder.addText('<' + tagName);
		}

		transformTopLevelJSXElement.processAttributes(path, program, builder);

		builder.addText('>'); // Close the opening tag
	}

	return { literalName, tagName, isComponentTag, isStatic };
};

transformTopLevelJSXElement.processAttributes = (
	path: NodePath<t.JSXElement>,
	program: t.Program,
	builder: TemplateBuilder,
): void => {
	const attributes = path.node.openingElement.attributes;

	for (const [ index, attr ] of attributes.entries()) {
		if (t.isJSXSpreadAttribute(attr)) {
			// If it's a spread attribute, we wrap it in our custom
			// `rest` directive.
			// This will allow us to handle the spread attribute correctly.
			// We also need to ensure that the `rest` directive is imported.
			ensure.restImport(program, path);

			const attrPath = path
				.get(`openingElement.attributes.${ index }.argument`);

			const newExpression = t.callExpression(
				t.identifier(VARIABLES.REST),
				[ attr.argument ],
			);
			attrPath.replaceWith(newExpression);

			builder.addText(' ');
			builder.addExpression(newExpression);

			continue;
		}

		const name = attr.name.name.toString();
		if (attr.value) {
			if (t.isJSXExpressionContainer(attr.value)) {
				// If the expression is empty, we can skip it.
				// This should not happen in valid JSX.
				if (t.isJSXEmptyExpression(attr.value.expression))
					throw new Error(ERROR_MESSAGES.EMPTY_JSX_EXPRESSION);

				const params: AttrExpressionParams = {
					builder,
					attr: attr as AttrExpressionParams['attr'],
					path,
					program,
				};

				if (name === ATTRIBUTES.REF)
					attributeProcessors.ref(params);
				else if (name === ATTRIBUTES.CLASS_LIST)
					attributeProcessors.classList(params);
				else if (name === ATTRIBUTES.STYLE)
					attributeProcessors.style(params);
				else if (name.startsWith(ATTRIBUTES.EVENT_PREFIX))
					attributeProcessors.event(params);
				else
					attributeProcessors.expression(params);

				builder.addExpression(attr.value.expression);

				continue;
			}

			attributeProcessors.nonExpression({
				builder,
				attr: attr as AttrNonExpressionParams['attr'],
				path,
				program,
			});

			continue;
		}

		// If the attribute has no value, we can add it as a boolean attribute.
		builder.addText(' ' + name);
	}
};

/** Returns true if the template is static. */
transformTopLevelJSXElement.processChildren = (
	path: NodePath<t.JSXElement>,
	program: t.Program,
	builder: TemplateBuilder,
	tagName: string,
	isStatic: boolean,
): boolean => {
	for (const [ index, child ] of path.node.children.entries()) {
		if (t.isJSXText(child)) {
			if (WHITESPACE_TAGS.includes(tagName))
				builder.addText(child.value);
			else
				builder.addText(child.value.trim());

			continue;
		}
		if (t.isJSXElement(child)) {
			const childPath = path
				.get(`children.${ index }`) as NodePath<t.JSXElement>;

			// Recursively process child elements
			if (transformTopLevelJSXElement.process(childPath, program, builder))
				isStatic = true;

			continue;
		}
		if (t.isJSXExpressionContainer(child)) {
			if (t.isJSXEmptyExpression(child.expression))
				continue;

			builder.addExpression(child.expression);
			continue;
		}
	}

	return isStatic;
};

transformTopLevelJSXElement.processClosingTag = (
	tagName: string,
	isComponentTag: boolean,
	literalName: string,
	builder: TemplateBuilder,
): void => {
	// If the tag is `DISCARD_TAG` we skip, as we did not add the opening tag.
	if (tagName === DISCARD_TAG) { /*  */ }
	// Add closing tag.
	else {
		// If it's a component tag, we need to close it with the static literal.
		if (isComponentTag) {
			builder.addText('</');
			builder.addExpression(t.identifier(literalName));
			builder.addText('>');
		}
		else {
			builder.addText('</' + tagName + '>');
		}
	}
};
