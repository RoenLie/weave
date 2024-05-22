/** @type {import('eslint').Linter.Config} */
module.exports = {
	extends: [
		'./base.js',
	],
	plugins: [
		'simple-import-sort',
		'import'
	],
	overrides: [
		{ /* Typescript, Javascript */
			files: [
				'*.js',
				'*.ts'
			],
			rules: {
				indent: 'off',
				semi: [
					'warn',
					'always'
				],
				'semi-spacing': [
					'warn',
					{
						before: false,
						after: true
					}
				],
				'space-before-blocks': 'warn',
				'space-before-function-paren': [
					'warn',
					{
						anonymous: 'never',
						named: 'never',
						asyncArrow: 'always'
					}
				],
				'space-infix-ops': 'warn',
				curly: [
					'warn',
					'multi-or-nest',
					'consistent'
				],
				'nonblock-statement-body-position': [
					'warn',
					'below'
				],
				'array-element-newline': [
					'warn',
					'consistent'
				],
				'array-bracket-newline': [
					'warn',
					{
						multiline: true
					}
				],
				'object-curly-newline': [
					'warn',
					{
						ObjectExpression: {
							consistent: true,
							multiline: true
						},
						ObjectPattern: {
							multiline: true
						},
						ImportDeclaration: {
							multiline: true
						},
						ExportDeclaration: {
							multiline: true
						}
					}
				],
				'object-property-newline': [
					'warn',
					{
						allowAllPropertiesOnSameLine: true
					}
				],
				'function-paren-newline': [
					'warn',
					'consistent'
				],
				'no-multiple-empty-lines': [
					'warn',
					{
						max: 2,
						maxEOF: 0
					}
				],
				'lines-between-class-members': [
					'warn',
					'always',
					{
						exceptAfterSingleLine: true
					}
				],
				'padded-blocks': [
					'warn',
					{
						classes: 'always',
						blocks: 'never',
						switches: 'never'
					}
				],
				'template-curly-spacing': ['warn', 'always'],
				'padding-line-between-statements': [
					'warn',
					{
						blankLine: 'always',
						prev: '*',
						next: 'return'
					},
					{
						blankLine: 'always',
						prev: 'if',
						next: '*'
					},
					{
						blankLine: 'any',
						prev: 'if',
						next: 'if'
					},
					{
						blankLine: 'always',
						prev: 'function',
						next: '*'
					},
					{
						blankLine: 'always',
						prev: 'import',
						next: '*'
					},
					{
						blankLine: 'any',
						prev: 'import',
						next: 'import'
					}
				],
				'no-trailing-spaces': 'warn',
				'space-in-parens': [
					'warn',
					'never'
				],
				'array-bracket-spacing': [
					'warn',
					'always'
				],
				'object-curly-spacing': [
					'warn',
					'always'
				],
				'max-len': [
					'warn',
					{
						code: 100,
						ignoreStrings: false,
						ignoreTemplateLiterals: false
					}
				],
				'brace-style': [
					'warn',
					'stroustrup',
					{ allowSingleLine: true }
				],
				'block-spacing': 'warn',
				'comma-spacing': [
					'warn',
					{
						before: false,
						after: true
					}
				],
				'keyword-spacing': [
					'warn',
					{
						before: true
					}
				],
				quotes: [
					'warn',
					'single',
					{
						allowTemplateLiterals: true,
						avoidEscape: true
					}
				],
				'prefer-arrow-callback': 'warn',
				'comma-dangle': [
					'warn',
					{
						arrays: 'always-multiline',
						objects: 'always-multiline',
						imports: 'always-multiline',
						exports: 'always-multiline',
						functions: 'always-multiline'
					}
				],
				'key-spacing': [
					'warn',
					{
						align: 'value'
					}
				],
				'prefer-const': 'warn',
				'no-prototype-builtins': 'off',
				'eol-last': ['warn', 'always'],
				'simple-import-sort/imports': 'warn',
				'simple-import-sort/exports': 'warn',
				'import/no-duplicates': 'warn',
				'no-multi-spaces': 'off'
			}
		},
		{ /* Typescript */
			files: [
				'*.ts'
			],
			rules: {
				'@typescript-eslint/indent': [
					'warn',
					'tab',
					{
						ignoredNodes: [
							'TSFunctionType',
							'TSTypeParameterInstantiation',
							'TemplateLiteral *'
						]
					}
				],
				'@typescript-eslint/ban-types': [
					'warn',
					{
						types: {
							Function: false
						},
						extendDefaults: true
					}
				],
				'@typescript-eslint/explicit-member-accessibility': [
					'warn',
					{
						accessibility: 'explicit',
						overrides: {
							constructors: 'no-public'
						}
					}
				],
				'@typescript-eslint/type-annotation-spacing': [
					'warn',
					{
						before: false,
						after: true,
						overrides: {
							arrow: {
								before: true,
								after: true
							}
						}
					}
				],
				'func-call-spacing': 'off', // conflicts with typescript generics
				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/ban-ts-comment': 'off',
				'@typescript-eslint/no-empty-interface': 'off',
				'@typescript-eslint/no-empty-function': 'off',
				'@typescript-eslint/no-non-null-assertion': 'off',
				'@typescript-eslint/no-unused-vars': ['warn', {
					argsIgnorePattern: '^ _'
				}],
				'@typescript-eslint/no-namespace': 'off',
			}
		},
	],
};
