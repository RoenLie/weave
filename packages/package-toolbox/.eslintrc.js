/** @type {import('eslint').Linter.Config} */
module.exports = {
	root: true,
	extends: ['@roenlie/eslint-config'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: true,
	},
};