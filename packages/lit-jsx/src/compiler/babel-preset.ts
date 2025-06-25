import type { PluginObj, PluginOptions } from '@babel/core';
import SyntaxJSX from '@babel/plugin-syntax-jsx';

import { postprocess } from './postprocess.ts';
import { preprocess } from './preprocess.ts';
import { transformJSXElement } from './transform-jsx.ts';
import { transformJSXElementCompiled } from './transform-jsx-compiled.ts';
import { transformJSXElementTemplate } from './transform-jsx-template.ts';


/** Compiles jsx to a combination of standard and compiled lit-html */
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


/** Compiles to standard lit-html */
export const litJsxBabelPresetTemplate = (
	context: any,
	options = {},
): { plugins: [PluginObj, PluginOptions][]; } => {
	return {
		plugins: [
			[
				{
					name:     'lit-jsx-transform-template',
					inherits: SyntaxJSX.default,
					visitor:  {
						JSXElement:  transformJSXElementTemplate,
						JSXFragment: transformJSXElementTemplate,
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


/** Compiles to compiled lit-html. */
export const litJsxBabelPresetCompiled = (
	context: any,
	options = {},
): { plugins: [PluginObj, PluginOptions][]; } => {
	return {
		plugins: [
			[
				{
					name:     'lit-jsx-transform-compiled',
					inherits: SyntaxJSX.default,
					visitor:  {
						JSXElement:  transformJSXElementCompiled,
						JSXFragment: transformJSXElementCompiled,
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
