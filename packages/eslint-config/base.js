const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');


/** @type {import('eslint').Linter.Config} */
module.exports = {
	env: {
		browser: true,
		node: true
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		emitDecoratorMetadata: true,
	},
	plugins: [
		'@typescript-eslint',
	],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/stylistic',
		'plugin:import/recommended',
		'plugin:import/typescript'
	],
	settings: {
		'import/resolver': {
			typescript: {
				project,
			},
			node: true
		},
	},
};
