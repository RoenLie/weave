import * as babel from '@babel/core';
import { bench, describe } from 'vitest';

import { litJsxBabelPresetCompiled } from '../../src/compiler/babel-preset.ts';

type BabelPlugins = NonNullable<NonNullable<babel.TransformOptions['parserOpts']>['plugins']>;


describe('Transform to compiled, benchmarks', () => {
	const opts: babel.TransformOptions = {
		root:           '.',
		filename:       'test.tsx',
		sourceFileName: 'test.tsx',
		presets:        [ litJsxBabelPresetCompiled ],
		plugins:        [],
		ast:            false,
		sourceMaps:     true,
		configFile:     false,
		babelrc:        false,
		parserOpts:     {
			plugins: [ 'jsx', 'typescript' ] satisfies BabelPlugins,
		},
	};

	bench('kitchen-sink', async () => {
		const source = `
		const template = (
			<div id="1" attribute={'value'} boolean={bool => true} property={as.prop([])} on-event={this.onClick}>
				{'child1'}
				<div attribute={'value'} id="2" boolean={as.bool(true)} property={prop => []} on-event={this.onClick}>
					{'child2'}
					<div attribute={'value'} boolean={bool => true} id="3" property={as.prop([])} on-event={this.onClick}>
						{'child3'}
						<div attribute={'value'} boolean={as.bool(true)} property={prop => []} id="4" on-event={this.onClick}>
							{'child4'}
						</div>
					</div>
				</div>
			</div>
		);
		`;

		await babel.transformAsync(source, opts);
	});
});
