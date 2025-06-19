import type { PluginObj, PluginOptions } from '@babel/core';
import SyntaxJSX from '@babel/plugin-syntax-jsx';

import { postprocess } from './postprocess.ts';
import { preprocess } from './preprocess.ts';
import { transformJSXElement } from './transform-jsx.ts';
import { transformJSXElementCompiled } from './transform-jsx2.ts';


/** Compiles to standard lit-html templates */
export const litJsxBabelPreset = (
	context: any,
	options = {},
): { plugins: [PluginObj, PluginOptions][]; } => {
	return {
		plugins: [
			[
				{
					name:     'lit-jsx-transform',
					inherits: SyntaxJSX.default,
					visitor:  {
						JSXElement:  transformJSXElement,
						JSXFragment: transformJSXElement,
						Program:     {
							enter: preprocess,
							exit:  postprocess,
						},
					},
				},
				Object.assign({
				}, options),
			],
		],
	};
};


/** Compiles to compiled lit-html where available. */
export const litJsxBabelPreset2 = (
	context: any,
	options = {},
): { plugins: [PluginObj, PluginOptions][]; } => {
	return {
		plugins: [
			[
				{
					name:     'lit-jsx-transform2',
					inherits: SyntaxJSX.default,
					visitor:  {
						JSXElement: transformJSXElementCompiled,
						//JSXFragment: transformJSXFragment,
						Program:    {
							enter: preprocess,
							exit:  postprocess,
						},
					},
				},
				Object.assign({
				}, options),
			],
		],
	};
};
