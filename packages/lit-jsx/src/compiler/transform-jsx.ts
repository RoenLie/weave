import { type PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';

import { isMathmlTag } from '../shared/mathml-tags.ts';
import { isSvgTag } from '../shared/svg-tags.ts';
import type { AttrExpressionParams, AttrNonExpressionParams } from './compiler-utils.ts';
import { attributeProcessors, ensure, isComponent, TemplateBuilder } from './compiler-utils.ts';
import {
	ATTRIBUTES, COMPONENT_LITERAL_PREFIX, DISCARD_TAG,
	ERROR_MESSAGES, VARIABLES, WHITESPACE_TAGS,
} from './config.ts';


export const transformJSX: VisitNode<
	PluginPass, t.JSXElement | t.JSXFragment
> = (path): void => {
	// If the path is a JSX fragment we need to strip out the fragment
	// and replace it with a JSX element that will be handled later.
	if (t.isJSXFragment(path.node)) {
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
	}
	else {
		// If the parent is not a JSX element,
		// we need to wrap the JSX in a tagged template expression
		if (!t.isJSXElement(path.parent)) {
			return void path.replaceWith(
				wrapJSXElementInTTL(path as NodePath<t.JSXElement>),
			);
		}
	}
};


const wrapJSXElementInTTL = (
	initialPath: NodePath<t.JSXElement>,
	program?: t.Program,
): t.TaggedTemplateExpression => {
	program ??= initialPath.findParent(p => t.isProgram(p.node))?.node as t.Program | undefined;
	if (!program)
		throw new Error(ERROR_MESSAGES.NO_PROGRAM_FOUND);

	const builder = new TemplateBuilder();
	let templateType = 'html' as 'html' | 'svg' | 'mathml';
	let isStatic = false;

	const openingElementId = initialPath.node.openingElement.name;
	if (!t.isJSXIdentifier(openingElementId))
		throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

	// We can only check for SVG and MathML tags if the tag is not a component tag.
	// As the component tag needs to be resolved at runtime.
	const openingElementTagName = openingElementId.name;
	if (isSvgTag(openingElementTagName))
		templateType = VARIABLES.SVG;
	else if (isMathmlTag(openingElementTagName))
		templateType = VARIABLES.MATHML;

	// We create a function to process the JSX element recursively.
	// This will allow us to handle nested elements and attributes.
	const process = (path: NodePath<t.JSXElement>): void => {
		const openingElement = path.node.openingElement;

		if (!t.isJSXIdentifier(openingElement.name))
			throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

		const tagName = openingElement.name.name;
		let isComponentTag: boolean = false;
		let literalName: string = '';

		// If the tag name is `DISCARD_TAG`, we skip it.
		// but we still need to process its children.
		if (tagName !== DISCARD_TAG) {
			isComponentTag = isComponent(tagName);

			if (isComponentTag) {
				// If it's a component, we will use lit static html function to wrap this parent.
				// then we create a static literal for the tag name at the top of the file.
				// and use that static literal in the template.
				// This will allow us to use the component as a tag name.

				isStatic = true;

				// Inject the unsafeStatic variable at the top of the file.
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

			const attributes = path.node.openingElement.attributes;
			attributes.forEach((attr, index) => {
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

					return;
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
					}
					else {
						attributeProcessors.rest({
							builder,
							attr: attr as AttrNonExpressionParams['attr'],
							path,
							program,
						});
					}
				}
				else {
					// If the attribute has no value, we can add it as a boolean attribute.
					builder.addText(' ' + name);
				}
			});

			builder.addText('>'); // Close the opening tag
		}

		path.node.children.forEach((child, index) => {
			if (t.isJSXText(child)) {
				//  We only preserve whitespace in pre and textarea tags.
				if (WHITESPACE_TAGS.includes(tagName))
					builder.addText(child.value);
				else
					builder.addText(child.value.trim());
			}
			else if (t.isJSXElement(child)) {
				// Recursively process child elements
				const childPath = path
					.get(`children.${ index }`) as NodePath<t.JSXElement>;

				process(childPath);
			}
			else if (t.isJSXExpressionContainer(child)) {
				if (t.isJSXEmptyExpression(child.expression))
					return;

				builder.addExpression(child.expression);
			}
		});

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
	process(initialPath);

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
