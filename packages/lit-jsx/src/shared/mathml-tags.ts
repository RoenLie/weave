/* cspell:disable */

/**
 * A comprehensive set of all MathML tag names.
 * This includes current and deprecated MathML elements from the MathML specification.
 */
export const mathmlTags: Set<string> = new Set([
	// Token Elements
	'mi', // identifier
	'mn', // number
	'mo', // operator
	'mtext', // text
	'mspace', // space
	'ms', // string literal

	// General Layout Elements
	'mrow', // horizontal group of sub-expressions
	'mfrac', // fraction
	'msqrt', // square root
	'mroot', // nth root
	'mstyle', // style change
	'merror', // error message
	'mpadded', // adjust spacing
	'mphantom', // make content invisible but preserve spacing
	'mfenced', // surround content with fences
	'menclose', // enclose content with stretching symbols

	// Script and Limit Elements
	'msub', // subscript
	'msup', // superscript
	'msubsup', // subscript-superscript pair
	'munder', // underscript
	'mover', // overscript
	'munderover', // underscript-overscript pair
	'mmultiscripts', // prescripts and tensor indices

	// Tabular Math Elements
	'mtable', // table
	'mtr', // table row
	'mtd', // table cell
	'maligngroup', // alignment group
	'malignmark', // alignment point

	// Elementary Math Elements (MathML 3)
	'mstack', // stacked notation
	'mlongdiv', // long division notation
	'msgroup', // group of rows in mstack
	'msrow', // row of digits
	'mscarries', // carries row
	'mscarry', // carry digit
	'msline', // horizontal line

	// Action Elements
	'maction', // bind actions to sub-expressions

	// Annotation Elements
	'semantics', // semantic annotation
	'annotation', // annotation
	'annotation-xml', // XML annotation

	// Content Elements (Content MathML)
	'apply', // function application
	'bind', // binding constructor
	'bvar', // bound variable
	'condition', // condition
	'declare', // declaration
	'lambda', // lambda expression
	'piecewise', // piecewise function
	'piece', // piece of piecewise function
	'otherwise', // default case

	// Arithmetic, Algebra, and Logic Operators
	'plus',
	'minus',
	'times',
	'divide',
	'power',
	'rem',
	'quotient',
	'factorial',
	'abs',
	'conjugate',
	'arg',
	'real',
	'imaginary',
	'floor',
	'ceiling',
	'exp',
	'ln',
	'log',
	'sin',
	'cos',
	'tan',
	'sec',
	'csc',
	'cot',
	'sinh',
	'cosh',
	'tanh',
	'sech',
	'csch',
	'coth',
	'arcsin',
	'arccos',
	'arctan',
	'arcsec',
	'arccsc',
	'arccot',
	'arcsinh',
	'arccosh',
	'arctanh',
	'arcsech',
	'arccsch',
	'arccoth',
	'root',
	'gcd',
	'lcm',
	'max',
	'min',
	'sum',
	'product',
	'limit',
	'mean',
	'sdev',
	'variance',
	'median',
	'mode',
	'moment',
	'momentabout',
	'and',
	'or',
	'xor',
	'not',
	'implies',
	'forall',
	'exists',

	// Relations
	'eq',
	'neq',
	'gt',
	'lt',
	'geq',
	'leq',
	'equivalent',
	'approx',
	'factorof',
	'tendsto',

	// Calculus and Vector Calculus
	'int',
	'diff',
	'partialdiff',
	'grad',
	'curl',
	'divergence',
	'laplacian',

	// Theory of Sets
	'set',
	'list',
	'union',
	'intersect',
	'in',
	'notin',
	'subset',
	'prsubset',
	'notsubset',
	'notprsubset',
	'setdiff',
	'card',
	'cartesianproduct',

	// Sequences and Series
	'lowlimit',
	'uplimit',
	'interval',

	// Trigonometry
	'inverse',

	// Statistics
	'vector',
	'matrix',
	'matrixrow',
	'determinant',
	'transpose',
	'selector',
	'vectorproduct',
	'scalarproduct',
	'outerproduct',

	// Constants
	'integers',
	'reals',
	'rationals',
	'naturalnumbers',
	'complexes',
	'primes',
	'exponentiale',
	'imaginaryi',
	'notanumber',
	'true',
	'false',
	'emptyset',
	'pi',
	'eulergamma',
	'infinity',

	// Linear Algebra
	'ident',

	// Semantic Mapping Elements
	'csymbol',
	'cn', // content number
	'ci', // content identifier
	'cs', // content string

	// Deprecated Elements
	'reln', // deprecated
	'fn', // deprecated
	'domainofapplication', // deprecated
	'sep', // deprecated

	// Experimental/Less Common Elements
	'mlabeledtr', // labeled table row
	'mglyph', // glyph
]);

/**
 * Check if a given tag name is a MathML tag.
 * @param tagName - The tag name to check
 * @returns true if the tag is a MathML tag, false otherwise
 */
export const isMathmlTag = (tagName: string): boolean => mathmlTags.has(tagName);
