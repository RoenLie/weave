// cspell:words hkern mpath vkern


/**
 * A comprehensive set of all SVG tag names.
 * This includes current and deprecated SVG elements from the SVG specification.
 */
export const svgTags: Set<string> = new Set([
	// Structure and Container Elements
	'g',
	'defs',
	'use',
	'symbol',
	'marker',
	'clipPath',
	'mask',
	'pattern',
	'image',
	'switch',
	'foreignObject',

	// Shape Elements
	'rect',
	'circle',
	'ellipse',
	'line',
	'polyline',
	'polygon',
	'path',

	// Text Elements
	'text',
	'tspan',
	'tref', // deprecated
	'textPath',
	'altGlyph', // deprecated
	'altGlyphDef', // deprecated
	'altGlyphItem', // deprecated
	'glyph', // deprecated
	'glyphRef', // deprecated

	// Gradient Elements
	'linearGradient',
	'radialGradient',
	'meshGradient',
	'meshPatch',
	'meshRow',
	'stop',

	// Animation Elements
	'animate',
	'animateMotion',
	'animateTransform',
	'animateColor', // deprecated
	'set',
	'mpath',

	// Filter Elements
	'filter',
	'feBlend',
	'feColorMatrix',
	'feComponentTransfer',
	'feComposite',
	'feConvolveMatrix',
	'feDiffuseLighting',
	'feDisplacementMap',
	'feDistantLight',
	'feDropShadow',
	'feFlood',
	'feFuncA',
	'feFuncB',
	'feFuncG',
	'feFuncR',
	'feGaussianBlur',
	'feImage',
	'feMerge',
	'feMergeNode',
	'feMorphology',
	'feOffset',
	'fePointLight',
	'feSpecularLighting',
	'feSpotLight',
	'feTile',
	'feTurbulence',

	// Font Elements (mostly deprecated)
	'font', // deprecated
	'font-face', // deprecated
	'font-face-format', // deprecated
	'font-face-name', // deprecated
	'font-face-src', // deprecated
	'font-face-uri', // deprecated
	'hkern', // deprecated
	'vkern', // deprecated
	'missing-glyph', // deprecated

	// Descriptive Elements
	'desc',
	'title',
	'metadata',

	// Other Elements
	'style',
	'script',
	'view',
	'cursor', // deprecated
	'a',
]);


/**
 * Check if a given tag name is an SVG tag.
 * @param tagName - The tag name to check
 * @returns true if the tag is an SVG tag, false otherwise
 */
export const isSvgTag = (tagName: string): boolean => {
	return svgTags.has(tagName);
};
