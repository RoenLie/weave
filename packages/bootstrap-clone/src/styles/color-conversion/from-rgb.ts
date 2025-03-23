// https://css-tricks.com/converting-color-spaces-in-javascript/

import type { HexColor } from './from-hex.ts';


export type RGBA = [ number, number, number, number ];
export type RGBColor = string & Record<never, never>;

export const isRGB = (color: string): color is RGBColor => /^rgba?\([\d,. /%]+\)$/.test(color);


export const extractRGB = (color: RGBColor): [ number, number, number, number ] => {
	const rgbRegex1 = /^rgba?\((\d+%?) +(\d+%?) +(\d+%?)(?: *\/ *(\d+(?:\.\d+?)?%?))?\)$/;
	const rgbRegex2 = /^rgba?\((\d+%?) *, *(\d+%?) *, *(\d+%?)(?: *, *(\d+(?:\.\d+?)?%?))?\)$/;

	const match = color.match(rgbRegex1) || color.match(rgbRegex2);
	if (!match)
		return [ 0, 0, 0, 1 ];

	const rgba: string[] = match.slice(1, 5)
		.map(val => (val ?? '1').trim());

	const values = rgba.map((val, i, { length }) => {
		const isPercent = val.includes('%');
		const value = Math.min(Math.max(0, parseFloat(val)), 255);

		if (i === length - 1) {
			if (isPercent)
				return Math.min(Math.max(0, value / 100), 1);

			return Math.min(Math.max(0, value), 1);
		}

		if (isPercent)
			return Math.min(Math.max(0, Math.ceil(value / 100 * 255)), 255);

		return Math.min(Math.max(0, Math.ceil(value)), 255);
	});

	return values as [ number, number, number, number ];
};


export function RGBtoHex(rgb: string): HexColor;
export function RGBtoHex(r: number, g: number, b: number, a?: number): HexColor;
export function RGBtoHex(r: string | number, g?: number, b?: number, a?: number): HexColor {
	if (arguments.length !== 1 && arguments.length < 3)
		throw new Error('Invalid input');

	if (arguments.length === 1)
		return RGBtoHexa(r as RGBColor).slice(0, -2);

	return RGBtoHexa(r as number, g!, b!, a ?? 1).slice(0, -2);
};


export function RGBtoHexa(rgb: string): HexColor;
export function RGBtoHexa(r: number, g: number, b: number, a?: number): HexColor;
export function RGBtoHexa(r: string | number, g?: number, b?: number, a?: number): HexColor {
	if (arguments.length !== 1 && arguments.length < 3)
		throw new Error('Invalid input');

	//  Set default values as if we supplied r, g, b as individual arguments
	const rgbaArr: [ number, number, number, number ] = [
		Math.min(Math.max(0, r as number), 255),
		Math.min(Math.max(0, g!), 255),
		Math.min(Math.max(0, b!), 255),
		Math.min(Math.max(0, a ?? 1), 1),
	];

	// If we supplied a single argument, extract the RGB values
	if (arguments.length === 1) {
		const rgba = extractRGB(r as RGBColor);

		[ rgbaArr[0], rgbaArr[1], rgbaArr[2], rgbaArr[3] ] = rgba;
	}

	let _r = rgbaArr[0].toString(16);
	let _g = rgbaArr[1].toString(16);
	let _b = rgbaArr[2].toString(16);
	let _a = Math.round(rgbaArr[3] * 255).toString(16);

	if (_r.length === 1)
		_r = '0' + _r;
	if (_g.length === 1)
		_g = '0' + _g;
	if (_b.length === 1)
		_b = '0' + _b;
	if (_a.length === 1)
		_a = '0' + _a;

	return '#' + _r + _g + _b + _a;
}
