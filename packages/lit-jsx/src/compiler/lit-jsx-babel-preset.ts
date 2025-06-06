import type { PluginObj, PluginOptions } from '@babel/core';
import SyntaxJSX from '@babel/plugin-syntax-jsx';

import { postprocess } from './postprocess.ts';
import { preprocess } from './preprocess.ts';
import { transformJSX } from './transform-jsx.ts';


export const litJsxBabelPreset = (
	context: any,
	options = {},
): { plugins: [PluginObj, PluginOptions][]; } => {
	return {
		plugins: [
			[
				{
					name:     'JSX DOM Expressions',
					inherits: SyntaxJSX.default,
					visitor:  {
						JSXElement:  transformJSX,
						JSXFragment: transformJSX,
						Program:     {
							enter: preprocess,
							exit:  postprocess,
						},
					},
				},
				Object.assign({
					//moduleName: 'solid-js/web',
					//builtIns:   [
					//	'For',
					//	'Show',
					//	'Switch',
					//	'Match',
					//	'Suspense',
					//	'SuspenseList',
					//	'Portal',
					//	'Index',
					//	'Dynamic',
					//	'ErrorBoundary',
					//],
					//contextToCustomElements: true,
					//wrapConditionals:        true,
					//generate:                'dom',
				}, options),
			],
			// Not sure what this is for yet.
			//Object.assign(
			//	{
			//		moduleName: 'solid-js/web',
			//		builtIns:   [
			//			//'For',
			//			//'Show',
			//			//'Switch',
			//			//'Match',
			//			//'Suspense',
			//			//'SuspenseList',
			//			//'Portal',
			//			//'Index',
			//			//'Dynamic',
			//			//'ErrorBoundary',
			//		],
			//		contextToCustomElements: true,
			//		wrapConditionals:        true,
			//		generate:                'dom',
			//	},
			//options,
			//),
		],
	};
};
