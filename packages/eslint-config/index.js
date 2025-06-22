import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { configs as litConfigs } from 'eslint-plugin-lit';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';


/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigArray} */
const recommended  = tseslint.config({
	name:    '@roenlie/eslint-config/recommended',
	extends: [ eslint.configs.recommended ],
	plugins: {
		'@stylistic':         stylistic,
		'simple-import-sort': simpleImportSort,
	},
	languageOptions: {
		parserOptions: {
			emitDecoratorMetadata: true,
			sourceType:            'module',
			ecmaVersion:           'latest',
			ecmaFeatures:          {
				jsx: true,
			},
		},
	},
	linterOptions: {
		reportUnusedDisableDirectives: 'off',
	},
	files:   [ '**/*.{js,jsx,mjs,cjs,ts,tsx}' ],
	ignores: [ '**/dist/**', '**/node_modules/**' ],
	rules:   {
		'simple-import-sort/imports': 'warn',
		'simple-import-sort/exports': 'warn',

		'curly': [
			'warn',
			'multi-or-nest',
			'consistent',
		],
		'prefer-arrow-callback': 'warn',
		'prefer-const':          [
			'warn',
			{
				'ignoreReadBeforeAssign': true,
				'destructuring':          'all',
			},
		],
		'no-prototype-builtins':           'off',
		'no-unused-private-class-members': 'off',

		'@stylistic/nonblock-statement-body-position': [
			'warn',
			'below',
		],
		'@stylistic/array-element-newline': [
			'warn',
			'consistent',
		],
		'@stylistic/array-bracket-newline': [
			'warn',
			{
				multiline: true,
			},
		],
		'@stylistic/object-curly-newline': [
			'warn',
			{
				ObjectExpression: {
					consistent: true,
					multiline:  true,
				},
				ObjectPattern: {
					multiline: true,
				},
				ImportDeclaration: {
					multiline: true,
				},
				ExportDeclaration: {
					multiline: true,
				},
			},
		],
		'@stylistic/object-property-newline': [
			'warn',
			{
				allowAllPropertiesOnSameLine: true,
			},
		],
		'@stylistic/function-paren-newline': [
			'warn',
			'consistent',
		],
		'@stylistic/no-multiple-empty-lines': [
			'warn',
			{
				max:    2,
				maxEOF: 0,
			},
		],
		'@stylistic/lines-between-class-members': [
			'warn',
			'always',
			{
				exceptAfterSingleLine: true,
			},
		],
		'@stylistic/padded-blocks': [
			'warn',
			{
				classes:  'always',
				blocks:   'never',
				switches: 'never',
			},
		],
		'@stylistic/template-curly-spacing':          [ 'warn', 'always' ],
		'@stylistic/padding-line-between-statements': [
			'warn',
			{
				blankLine: 'always',
				prev:      '*',
				next:      'return',
			},
			{
				blankLine: 'always',
				prev:      'if',
				next:      '*',
			},
			{
				blankLine: 'any',
				prev:      'if',
				next:      'if',
			},
			{
				blankLine: 'always',
				prev:      'function',
				next:      '*',
			},
			{
				blankLine: 'always',
				prev:      'import',
				next:      '*',
			},
			{
				blankLine: 'any',
				prev:      'import',
				next:      'import',
			},
		],
		'@stylistic/no-trailing-spaces': 'warn',
		'@stylistic/space-in-parens':    [
			'warn',
			'never',
		],
		'@stylistic/array-bracket-spacing': [
			'warn',
			'always',
		],
		'@stylistic/object-curly-spacing': [
			'warn',
			'always',
		],
		'@stylistic/max-len': [
			'warn',
			{
				code:                   130,
				comments:               150,
				tabWidth:               3,
				ignoreStrings:          false,
				ignoreComments:         false,
				ignoreTemplateLiterals: false,
				ignoreUrls:             true,
				ignoreRegExpLiterals:   true,
				// This allows imports to be as long as they want
				ignorePattern:          'import .*?;',
			},
		],
		'@stylistic/brace-style': [
			'warn',
			'stroustrup',
			{ allowSingleLine: true },
		],
		'@stylistic/block-spacing': 'warn',
		'@stylistic/comma-spacing': [
			'warn',
			{
				before: false,
				after:  true,
			},
		],
		'@stylistic/keyword-spacing': [
			'warn',
			{
				before: true,
			},
		],
		'@stylistic/quotes': [
			'warn',
			'single',
			{
				allowTemplateLiterals: true,
				avoidEscape:           true,
			},
		],
		'@stylistic/comma-dangle':    [ 'warn', 'always-multiline' ],
		'@stylistic/eol-last':        [ 'warn', 'always' ],
		'@stylistic/no-multi-spaces': 'off',
		'@stylistic/semi-spacing':    [
			'warn', {
				before: false,
				after:  true,
			},
		],
		'@stylistic/space-before-blocks':         'warn',
		'@stylistic/space-before-function-paren': [
			'warn',
			{
				anonymous:  'never',
				named:      'never',
				asyncArrow: 'always',
			},
		],
		'@stylistic/space-infix-ops': 'warn',
		'@stylistic/semi':            [
			'warn',
			'always',
		],
		'@stylistic/member-delimiter-style': [
			'warn',
			{
				'multiline': {
					'delimiter':   'semi',
					'requireLast': true,
				},
				'singleline': {
					'delimiter':   'semi',
					'requireLast': true,
				},
				'multilineDetection': 'brackets',
			},
		],
		'@stylistic/type-annotation-spacing': [
			'warn',
			{
				before:    false,
				after:     true,
				overrides: {
					arrow: {
						before: true,
						after:  true,
					},
				},
			},
		],
		'@stylistic/key-spacing': [
			'warn',
			{
				align: 'value',
			},
		],
		'@stylistic/indent': [
			'warn',
			'tab',
			{
				ignoredNodes: [
					'TSFunctionType',
					'TSTypeParameterInstantiation',
					'TemplateLiteral *',
				],
			},
		],

		// Turned off for non typescript files.
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/explicit-member-accessibility':  'off',
	},
});

/** @type { import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigArray } */
const recommendedTs = tseslint.config({
	name:    '@roenlie/eslint-config/recommended-ts',
	extends: [
		...tseslint.configs.strict,
		...tseslint.configs.stylistic,
	],
	files:   [ '**/*.{ts,tsx}' ],
	ignores: [ '**/dist/**', '**/node_modules/**' ],
	rules:   {
		'@typescript-eslint/explicit-member-accessibility': [
			'warn',
			{
				accessibility: 'no-public',
				overrides:     {
					constructors: 'no-public',
				},
			},
		],
		'func-call-spacing':                        'off', // conflicts with typescript generics
		'@typescript-eslint/no-explicit-any':       'off',
		'@typescript-eslint/ban-ts-comment':        'off',
		'@typescript-eslint/no-empty-interface':    'off',
		'@typescript-eslint/no-empty-function':     'off',
		'@typescript-eslint/no-non-null-assertion': 'off',
		'no-unused-vars':                           'off',
		'@typescript-eslint/no-unused-vars':        [
			'warn', {
				args:                           'none',
				argsIgnorePattern:              '^_',
				caughtErrors:                   'none',
				caughtErrorsIgnorePattern:      '^_',
				destructuredArrayIgnorePattern: '^_',
				vars:                           'all',
				varsIgnorePattern:              '^_',
				ignoreRestSiblings:             true,
			},
		],
		'@typescript-eslint/no-namespace':                    'off',
		'@typescript-eslint/no-dynamic-delete':               'off',
		'@typescript-eslint/no-extraneous-class':             'off',
		'@typescript-eslint/no-useless-constructor':          'off',
		'@typescript-eslint/no-unused-expressions':           'off',
		'@typescript-eslint/no-invalid-void-type':            'off',
		'@typescript-eslint/no-empty-object-type':            'off',
		'@typescript-eslint/consistent-indexed-object-style': 'off',
		'@typescript-eslint/no-this-alias':                   'off',
		'@typescript-eslint/no-inferrable-types':             'off',
		'@typescript-eslint/consistent-generic-constructors': [ 'warn', 'type-annotation' ],
		'@typescript-eslint/explicit-module-boundary-types':  [
			'warn', {
				allowArgumentsExplicitlyTypedAsAny: true,
			},
		],
	},
});


/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigArray} */
const node = tseslint.config({
	extends: [],
	files:   [ '**/*.{js,jsx,mjs,cjs,ts,tsx}' ],
	ignores: [ '**/dist/**' ],
});


/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigArray} */
const lit = tseslint.config({
	extends: [ litConfigs['flat/recommended'] ],
	files:   [ '**/*.{js,jsx,mjs,cjs,ts,tsx}' ],
	ignores: [ '**/dist/**' ],
});


/** @type { typeof import('./index.d.ts').configs } */
export default {
	recommended: [ ...recommended, ...recommendedTs ],
	node:        [ ...recommended, ...recommendedTs, ...node ],
	lit:         [ ...recommended, ...recommendedTs, ...lit ],
};
