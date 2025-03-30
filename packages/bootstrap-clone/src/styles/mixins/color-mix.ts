import { RGBA } from '../color-conversion/rgba.ts';


type ColorSpace = 'srgb' | 'lab' | 'oklab' | 'xyz' | 'xyz-d50' | 'xyz-d65' | 'hsl' | 'hwb' | 'lch' | 'oklch';


/**
 * Implements the CSS color-mix() function in JavaScript
 * @param space  - Color space to perform the mixing in
 * @param c1      - First color
 * @param p1 - Percentage of the first color (0-100)
 * @param c2      - Second color
 * @param p2 - Percentage of the second color (0-100)
 * @returns           - Resulting color in rgba format
 */
export const colorMix = (options: {
	colorSpace: ColorSpace;
	color1:     string | RGBA;
	percent1?:  number;
	color2:     string | RGBA;
	percent2?:  number;
}): RGBA => {
	const {
		colorSpace = 'srgb',
		color1,
		percent1,
		color2,
		percent2,
	} = options;

	const mixString = 'color-mix(in '
		+ colorSpace + ', '
		+ color1 + (percent1 !== undefined ? ' ' + percent1 + '%' : '') + ', '
		+ color2 + (percent2 !== undefined ? ' ' + percent2 + '%' : '') + ')';

	const rgba = convertToRgb(mixString);

	return rgba;
};


/**
 * Converts any CSS color to RGB format using Canvas
 * @param color - CSS color to convert
 * @returns - Color as a tuple of [R, G, B, A] values
 * @example
 * ```ts
 * const color = convertToRgb('color-mix(in srgb, red, blue)');
 * console.log(color); // [128, 0, 128, 1]
 * ```
 */
export const convertToRgb = (color: string): RGBA => {
	const ctx = convertToRgb.ctx.value;

	// Fill with the color and get data
	ctx.clearRect(0, 0, 1, 1);
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, 1, 1);

	const imgData = ctx.getImageData(0, 0, 1, 1);
	const rgba = new RGBA(imgData);

	return rgba;
};

convertToRgb.ctx = (() => {
	let context: CanvasRenderingContext2D | undefined;
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	const createCtx = () => {
		const canvas = document.createElement('canvas');
		canvas.width = 1;
		canvas.height = 1;

		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		if (!ctx)
			throw new Error('Could not get canvas context');

		context = ctx;
		scheduleCleanup();

		return context;
	};

	const scheduleCleanup = () => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => context = undefined, 5000);

		return context!;
	};

	return {
		get value(): CanvasRenderingContext2D {
			return context ? scheduleCleanup() : createCtx();
		},
	};
})();


export const rgbToString = (rgba: RGBA): string => {
	return rgba.toString();
};
