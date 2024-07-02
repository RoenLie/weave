import { expect, test } from 'vitest';

import { extractExports } from '../src/resolve-pkg-deps.js';


test('Wierd nested exports', () => {
	const packageName = 'tslib';
	const exports = {
		'.': {
			'module': {
				'types':   './modules/index.d.ts',
				'default': './tslib.es6.mjs',
			},
			'import': {
				'node':    './modules/index.js',
				'default': {
					'types':   './modules/index.d.ts',
					'default': './tslib.es6.mjs',
				},
			},
			'default': './tslib.js',
		},
		'./*': './*',
		'./':  './',
	};

	const parsed = extractExports(packageName, exports);

	expect([ ...parsed ]).to.be.deep.equal([
		[ 'tslib', 'tslib/tslib.es6.mjs' ],
		[ 'tslib/', 'tslib/' ],
	]);
});


test('Single level nested with correct default', () => {
	const packageName = '@roenlie/mimic-core';
	const exports = {
		'.': {
			'types':   './dist/lib/index.d.ts',
			'default': './dist/lib/index.js',
		},
		'./animation': {
			'types':   './dist/lib/animation/index.d.ts',
			'default': './dist/lib/animation/index.js',
		},
		'./localize': {
			'types':   './dist/lib/localize/index.d.ts',
			'default': './dist/lib/localize/index.js',
		},
		'./node-tree': {
			'types':   './dist/lib/node-tree/index.d.ts',
			'default': './dist/lib/node-tree/index.js',
		},
	};

	const parsed = extractExports(packageName, exports);

	expect([ ...parsed ]).to.be.deep.equal([
		[ '@roenlie/mimic-core',           '@roenlie/mimic-core/dist/lib/index.js' ],
		[ '@roenlie/mimic-core/animation', '@roenlie/mimic-core/dist/lib/animation/index.js' ],
		[ '@roenlie/mimic-core/localize',  '@roenlie/mimic-core/dist/lib/localize/index.js' ],
		[ '@roenlie/mimic-core/node-tree', '@roenlie/mimic-core/dist/lib/node-tree/index.js' ],
	]);
});
