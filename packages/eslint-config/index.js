import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import litConfig from 'eslint-plugin-lit';
import stylistic from '@stylistic/eslint-plugin';


const base = tseslint.config({
	name:    '@roenlie/eslint-config/base',
	extends: [
		eslint.configs.recommended,
		...tseslint.configs.strict,
		...tseslint.configs.stylistic,
	],
	plugins: {
		'@stylistic': stylistic,
	},
	languageOptions: {
		parserOptions: {
			emitDecoratorMetadata: true,
			sourceType:            'module',
			ecmaVersion:           'latest',
		},
	},
	linterOptions: {
		reportUnusedDisableDirectives: 'off',
	},
	rules: {
		'curly': [
			'warn',
			'multi-or-nest',
			'consistent',
		],
		'prefer-arrow-callback':           'warn',
		'prefer-const':                    'warn',
		'no-prototype-builtins':           'off',
		'no-unused-private-class-members': 'off',

		// Stylistic things.
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
				code:                   100,
				ignoreStrings:          true,
				ignoreTemplateLiterals: true,
				ignoreRegExpLiterals:   true,
				ignoreComments:         true,
				ignoreUrls:             true,
				// This allows imports to be longer than 100ch
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
		'@stylistic/comma-dangle': [
			'warn',
			{
				arrays:    'always-multiline',
				objects:   'always-multiline',
				imports:   'always-multiline',
				exports:   'always-multiline',
				functions: 'always-multiline',
			},
		],

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

		// Typescript spesific things.
		'@typescript-eslint/explicit-member-accessibility': [
			'warn',
			{
				accessibility: 'explicit',
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
		'@typescript-eslint/no-unused-vars':        [
			'warn', {
				'args':                           'all',
				'argsIgnorePattern':              '^_',
				'caughtErrors':                   'all',
				'caughtErrorsIgnorePattern':      '^_',
				'destructuredArrayIgnorePattern': '^_',
				'varsIgnorePattern':              '^_',
				'ignoreRestSiblings':             true,
			},
		],
		'@typescript-eslint/no-namespace':           'off',
		'@typescript-eslint/no-dynamic-delete':      'off',
		'@typescript-eslint/no-extraneous-class':    'off',
		'@typescript-eslint/no-useless-constructor': 'off',
		'@typescript-eslint/no-unused-expressions':  'off',
		'@typescript-eslint/no-invalid-void-type':   'off',
	},
});


const node = tseslint.config({
	extends: [],
});


const lit = tseslint.config({
	extends: [ litConfig.configs['flat/recommended'] ],
});


export default {
	base,
	node: [ ...base, ...lit ],
	lit:  [ ...base, ...lit ],
	all:  [ ...base, ...node, ...lit ],
};
