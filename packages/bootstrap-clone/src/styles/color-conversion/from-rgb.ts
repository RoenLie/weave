import type { HexColor } from './from-hex.ts';


export type RGBColor = string & Record<never, never>;


export const isRGB = (color: string): boolean => {
	const rgbRegex = /^rgb\((\d{1,3}), *(\d{1,3}), *(\d{1,3})\)$/;
	const match = color.match(rgbRegex);
	if (!match)
		return false;

	// Check if all values are between 0-255
	return match.slice(1).every(val => parseInt(val) >= 0 && parseInt(val) <= 255);
};
export const isRGBA = (color: string): boolean => {
	const rgbaRegex = /^rgba\((\d{1,3}), *(\d{1,3}), *(\d{1,3}), *(\d{1}(?:\.\d{1,3})?)\)$/;
	const match = color.match(rgbaRegex);
	if (!match)
		return false;

	// Check RGB values (0-255) and alpha (0-1)
	const [ r, g, b, a ] = match
		.slice(1)
		.map(val => parseFloat(val)) as [ number, number, number, number ];

	const validRGB = [ r, g, b ].every(val => val >= 0 && val <= 255);
	const validAlpha = a >= 0 && a <= 1;

	return validRGB && validAlpha;
};


export function extractRGB(rgb: RGBColor): [ number, number, number ];
export function extractRGB(rgb: RGBColor, includeAlpha: true): [ number, number, number, number ];
export function extractRGB(rgb: RGBColor, includeAlpha = false): [ number, number, number ] | [ number, number, number, number ] {
	if (!isRGB(rgb) && !isRGBA(rgb))
		throw new Error('Invalid RGB color');

	// Choose correct separator
	const sep = rgb.indexOf(',') > -1 ? ',' : ' ';

	// Turn "rgb(r,g,b)" into [r,g,b]
	const values = rgb
		.split('(')[1]!
		.split(')')[0]!
		.split(sep)
		.map(s => parseInt(s));

	const [ r, g, b, a ] = values as [ number, number, number, number | undefined ];

	return includeAlpha
		? [ r, g, b, a ?? 1 ]
		: [ r, g, b ];
};


export function RGBtoHex(rgb: string): HexColor;
export function RGBtoHex(r: number, g: number, b: number): HexColor;
export function RGBtoHex(r: string | number, g?: number, b?: number): HexColor {
	let _r: string | number;
	let _g: string | number;
	let _b: string | number;

	if (arguments.length == 1) {
		const rgb = r as string;
		// Choose correct separator
		const sep = rgb.indexOf(',') > -1 ? ',' : ' ';
		// Turn "rgb(r,g,b)" into [r,g,b]
		const values = rgb
			.split('(')[1]!
			.split(')')[0]!
			.split(sep)
			.map(s => {
				if (s.indexOf('%') > -1)
					return Math.round(parseInt(s.substring(0, s.length - 1)) / 100 * 255);

				return parseInt(s.trim());
			});

		_r = values[0]!.toString(16);
		_g = values[1]!.toString(16);
		_b = values[2]!.toString(16);
	}
	else if (arguments.length == 3) {
		_r = r.toString(16);
		_g = g!.toString(16);
		_b = b!.toString(16);
	}
	else {
		throw new Error('Invalid input');
	}

	if (_r.length == 1)
		_r = '0' + _r;
	if (_g.length == 1)
		_g = '0' + _g;
	if (_b.length == 1)
		_b = '0' + _b;

	return '#' + _r + _g + _b;
};


export function RGBAtoHex(rgba: string): HexColor;
export function RGBAtoHex(r: number, g: number, b: number, a: number): HexColor;
export function RGBAtoHex(r: string | number, g?: number, b?: number, a?: number): HexColor {
	let _r: string | number = '';
	let _g: string | number = '';
	let _b: string | number = '';
	let _a: string | number = '';

	if (arguments.length == 1) {
		const rgba = r as string;
		const sep = rgba.indexOf(',') > -1 ? ',' : ' ';
		const rgbaArr = rgba.split('(')[1]!.split(')')[0]!.split(sep);

		// Strip the slash if using space-separated syntax
		if (rgbaArr.indexOf('/') > -1)
			rgbaArr.splice(3, 1);

		for (const R in rgbaArr) {
			const r = rgbaArr[R]!;
			if (r.indexOf('%') > -1) {
				const p = parseInt(r.substring(0, r.length - 1)) / 100;

				if (parseInt(R) < 3)
					rgbaArr[R] = ('' + Math.round(p * 255));
				else
					rgbaArr[R] = '' + p;
			}
		}

		_r = (+rgbaArr[0]!).toString(16),
		_g = (+rgbaArr[1]!).toString(16),
		_b = (+rgbaArr[2]!).toString(16),
		_a = Math.round(+rgbaArr[3]! * 255).toString(16);
	}
	else if (arguments.length == 4) {
		_r = r.toString(16);
		_g = g!.toString(16);
		_b = b!.toString(16);
		_a = Math.round(a! * 255).toString(16);
	}
	else {
		throw new Error('Invalid input');
	}


	if (_r.length == 1)
		_r = '0' + _r;
	if (_g.length == 1)
		_g = '0' + _g;
	if (_b.length == 1)
		_b = '0' + _b;
	if (_a.length == 1)
		_a = '0' + _a;

	return '#' + _r + _g + _b + _a;
}
