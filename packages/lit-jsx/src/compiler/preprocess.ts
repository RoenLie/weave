import type { PluginPass } from '@babel/core';
import type { VisitNodeFunction } from '@babel/traverse';
import { isJSXElement, isJSXIdentifier, type Program } from '@babel/types';
import { isValidHTMLNesting } from 'validate-html-nesting';

import { defaultConfig } from './config.ts';
import { type CustomNodePath, isComponent } from './utils.ts';


// From https://github.com/MananTank/babel-plugin-validate-jsx-nesting/blob/main/src/index.js
const JSXValidator = {
	JSXElement(path: any) {
		const elName = path.node.openingElement.name;
		const parent = path.parent;

		if (!isJSXElement(parent) || !isJSXIdentifier(elName))
			return;

		const elTagName = elName.name;
		if (isComponent(elTagName))
			return;

		const parentElName = parent.openingElement.name;
		if (!isJSXIdentifier(parentElName))
			return;

		const parentElTagName = parentElName.name;
		if (!isComponent(parentElTagName)) {
			if (!isValidHTMLNesting(parentElTagName, elTagName)) {
				throw path.buildCodeFrameError(
				`Invalid JSX: <${ elTagName }> cannot be child of <${ parentElTagName }>`,
				);
			}
		}
	},
};


export const preprocess: VisitNodeFunction<PluginPass, Program> = (_path, state): void => {
	const path = _path as CustomNodePath<Program>;
	const config = path.hub.file.metadata.config = Object.assign({}, defaultConfig, state.opts);

	if (config.validate)
		path.traverse(JSXValidator);
};
