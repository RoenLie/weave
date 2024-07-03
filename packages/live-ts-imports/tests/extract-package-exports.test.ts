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
	const packageName = '@roenlie/core';
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
		[ '@roenlie/core',           '@roenlie/core/dist/lib/index.js' ],
		[ '@roenlie/core/animation', '@roenlie/core/dist/lib/animation/index.js' ],
		[ '@roenlie/core/localize',  '@roenlie/core/dist/lib/localize/index.js' ],
		[ '@roenlie/core/node-tree', '@roenlie/core/dist/lib/node-tree/index.js' ],
	]);
});
