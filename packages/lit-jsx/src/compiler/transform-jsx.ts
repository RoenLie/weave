import { type PluginPass } from '@babel/core';
import type { NodePath, VisitNode } from '@babel/traverse';
import * as t from '@babel/types';

import { getTemplateType, isJSXElementStatic, isJSXFunctionElementComponent } from './compiler-utils.ts';
import { processJSXElementToCompiled } from './transform-jsx-compiled.ts';
import { processJSXElementToTemplate, processTemplate } from './transform-jsx-template.ts';


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


const processJSXElement = (path: NodePath<t.JSXElement | t.JSXFragment>) => {
	const isStatic = isJSXElementStatic(path);
	const templateType = getTemplateType(path);
	const isFunctionComponent = isJSXFunctionElementComponent(path)

	if (isFunctionComponent)
		return processTemplate.createFunctionalComponent(path);

	if (isStatic || templateType !== 'html')
		return processJSXElementToTemplate(path);

	return processJSXElementToCompiled(path);
};
