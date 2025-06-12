export const defaultConfig = {
	validate: true,
};


export const COMPONENT_LITERAL_PREFIX = '__$';
export const DISCARD_TAG = 'discard';
export const WHITESPACE_TAGS: string[] = [ 'pre', 'textarea' ];
export const SPECIAL_TAGS: string[] = [ 'For', 'If' ];
export const ATTR_NAMES = {
	REF:          'ref',
	CLASS_LIST:   'classList',
	STYLE_LIST:   'styleList',
	EVENT_PREFIX: 'on-',
} as const;
export const ATTR_VALUES = {
	BOOL: 'bool',
	ATTR: 'attr',
	PROP:	'prop',
	DIR:  'dir',
} as const;
export const VARIABLES = {
	HTML:          'html',
	HTML_STATIC:   'htmlStatic',
	SVG:           'svg',
	SVG_STATIC:    'svgStatic',
	MATHML:        'mathml',
	MATHML_STATIC: 'mathmlStatic',
	UNSAFE_STATIC: 'unsafeStatic',
	CLASS_MAP:     'classMap',
	STYLE_MAP:     'styleMap',
	REF:           'ref',
	REST:          '__$rest',
	LITERAL_MAP:   '__$literalMap',
} as const;
export const SOURCES = {
	HTML:              'lit-html',
	HTML_ALT:          'lit',
	HTML_STATIC:       'lit-html/static.js',
	HTML_STATIC_ALT:   'lit/static-html.js',
	SVG:               'lit-html/directives/svg.js',
	SVG_ALT:           'lit/directives/svg.js',
	MATHML:            'lit-html/directives/mathml.js',
	MATHML_ALT:        'lit/directives/mathml.js',
	SVG_STATIC:        'lit-html/static.js',
	SVG_STATIC_ALT:    'lit/static-html.js',
	MATHML_STATIC:     'lit-html/static.js',
	MATHML_STATIC_ALT: 'lit/static-html.js',
	UNSAFE_STATIC:     'lit-html/static.js',
	UNSAFE_STATIC_ALT: 'lit/static-html.js',
	REF:               'lit-html/directives/ref.js',
	REF_ALT:           'lit/directives/ref.js',
	CLASS_MAP:         'lit-html/directives/class-map.js',
	CLASS_MAP_ALT:     'lit/directives/class-map.js',
	STYLE_MAP:         'lit-html/directives/style-map.js',
	STYLE_MAP_ALT:     'lit/directives/style-map.js',
	REST:              'jsx-lit',
	LITERAL_MAP:       'jsx-lit',
} as const;
export const ERROR_MESSAGES = {
	NO_PROGRAM_FOUND:      'No program found for JSX transformation.',
	INVALID_OPENING_TAG:   'Invalid opening tag found.',
	EMPTY_JSX_EXPRESSION:  'Empty JSX expression found.',
	ONLY_STRING_LITERALS:  'Only string literals are supported for JSX attributes.',
	TAG_NAME_NOT_FOUND:    (tagName: string): string => `Tag name '${ tagName }' not found in any accessible scope`,
	NO_STATEMENT_PATH:     (tagName: string): string => `Could not find statement-level path for tagName: ${ tagName }`,
	UNKNOWN_TEMPLATE_TYPE: (type: string): string => `Unknown template type: ${ type }`,
} as const;
