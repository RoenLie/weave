type ColorSpace = 'srgb' | 'lab' | 'oklab' | 'xyz' | 'xyz-d50' | 'xyz-d65' | 'hsl' | 'hwb' | 'lch' | 'oklch';


/**
 * Implements the CSS color-mix() function in JavaScript
 * @param colorSpace  - Color space to perform the mixing in
 * @param color1      - First color
 * @param percentage1 - Percentage of the first color (0-100)
 * @param color2      - Second color
 * @param percentage2 - Percentage of the second color (0-100)
 * @returns           - Resulting color in rgba format
 */
export const colorMix = (
	colorSpace: ColorSpace = 'srgb',
	color1: string,
	percentage1: number = 100,
	color2: string,
	percentage2: number = 100,
): void => {
	const el = globalThis.document.createElement('div');

	el.style.display = 'none';
	el.style.setProperty(
		'color',
		`color-mix(in ${ colorSpace }, ${ color1 } ${ percentage1 }%, ${ color2 } ${ percentage2 }%)`,
	);

	globalThis.document.body.appendChild(el);
	const computedColor = el.computedStyleMap().get('color')?.toString();
	globalThis.document.body.removeChild(el);

	console.log('HERE SHOULD BE COLOR', computedColor);
};
