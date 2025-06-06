import type { PluginPass } from '@babel/core';
import type { VisitNodeFunction } from '@babel/traverse';
import type { Program } from '@babel/types';
import * as t from '@babel/types';
import { isValidHTMLNesting } from 'validate-html-nesting';

import { defaultConfig } from './config.ts';
import { type CustomNodePath, isComponent } from './utils.ts';


// From https://github.com/MananTank/babel-plugin-validate-jsx-nesting/blob/main/src/index.js
const JSXValidator = {
	JSXElement(path: any) {
		const elName = path.node.openingElement.name;
		const parent = path.parent;

		if (!t.isJSXElement(parent) || !t.isJSXIdentifier(elName))
			return;

		const elTagName = elName.name;
		if (isComponent(elTagName))
			return;

		const parentElName = parent.openingElement.name;
		if (!t.isJSXIdentifier(parentElName))
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

	// This seems to be a solidjs thing.
	/*
	const lib = config.requireImportSource;
	if (lib) {
		const comments = hub.file.ast.comments ?? [];
		let process = false;
		for (const comment of comments) {
			const index = comment.value.indexOf('@jsxImportSource');
			if (index > -1 && comment.value.slice(index).includes(lib)) {
				process = true;
				break;
			}
		}

		if (!process) {
			path.skip();

			return;
		}
	}
	*/

	if (config.validate)
		path.traverse(JSXValidator);
};
