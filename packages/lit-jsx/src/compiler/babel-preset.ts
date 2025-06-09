import type { PluginObj, PluginOptions } from '@babel/core';
import SyntaxJSX from '@babel/plugin-syntax-jsx';

import { postprocess } from './postprocess.ts';
import { preprocess } from './preprocess.ts';
import { transformJSXElement, transformJSXFragment } from './transform-jsx.ts';


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
						JSXFragment: transformJSXFragment,
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
