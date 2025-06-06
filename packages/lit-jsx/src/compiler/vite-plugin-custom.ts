import * as babel from '@babel/core';
import { mergeAndConcat } from 'merge-anything';
import type { PluginOption } from 'vite';

import { litJsxBabelPreset } from './lit-jsx-babel-preset.ts';


export const litJsxCustom = (options: {
	/** Options for the Babel transform */
	babel?:
		| babel.TransformOptions
		| ((code: string, id: string) => babel.TransformOptions | Promise<babel.TransformOptions>);
} = {}): PluginOption => {
	let projectRoot: string;

	return {
		name:   'lit-jsx-custom',
		config: {
			order: 'pre',
			handler(userConfig, env) {
				projectRoot = userConfig.root ?? process.cwd();
			},
		},
		transform: {
			filter: {
				id:   [ '**/*.jsx', '**/*.tsx' ],
				code: [ '/>', '</' ],
			},
			order: 'pre',
			async handler(source, id) {
				type BabelPlugins = NonNullable<NonNullable<babel.TransformOptions['parserOpts']>['plugins']>;
				const plugins: BabelPlugins = [ 'jsx' ];
				if (id.endsWith('.tsx'))
					plugins.push('typescript');

				// Default value for babel user options
				let babelUserOptions: babel.TransformOptions = {};

				if (options.babel) {
					if (typeof options.babel === 'function') {
						const babelOptions = options.babel(source, id);
						babelUserOptions = babelOptions instanceof Promise
							? await babelOptions
							: babelOptions;
					}
					else {
						babelUserOptions = options.babel;
					}
				}

				const babelOptions: babel.TransformOptions = {
					root:           projectRoot,
					filename:       id,
					sourceFileName: id,
					presets:        [
						[
							litJsxBabelPreset,
							/* merged into the metadata obj through state.opts */
							{},
						],
					],
					plugins:    [],
					ast:        false,
					sourceMaps: true,
					configFile: false,
					babelrc:    false,
					parserOpts: {
						plugins,
					},
				};

				const opts = mergeAndConcat(babelUserOptions, babelOptions);
				const result = await babel.transformAsync(source, opts);
				console.log('Transformed code:', result?.code);
			},
		},
	};
};
