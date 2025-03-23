import type { RGBColor } from './from-rgb.ts';

export type HexColor = string & Record<never, never>;


export const hexToRGB = (hex: HexColor, percent: boolean = false): RGBColor => {
	let r: string | number = 0;
	let g: string | number = 0;
	let b: string | number = 0;

	// 3 digits
	if (hex.length == 4) {
		r = '0x' + hex[1] + hex[1];
		g = '0x' + hex[2] + hex[2];
		b = '0x' + hex[3] + hex[3];
	}
	// 6 digits
	else if (hex.length == 7) {
		r = '0x' + hex[1] + hex[2];
		g = '0x' + hex[3] + hex[4];
		b = '0x' + hex[5] + hex[6];
	}

	if (percent) {
		r = +(r as number / 255 * 100).toFixed(1);
		g = +(g as number / 255 * 100).toFixed(1);
		b = +(b as number / 255 * 100).toFixed(1);
	}

	// the + symbols before the variables (+r, +g, +b) are necessary because
	// they function as the unary plus operator that converts the values
	// from hexadecimal strings to decimal numbers.
	return 'rgb('
		+ (percent
			? r + '%,' + g + '%,' + b + '%'
			: +r + ',' + +g + ',' + +b)
		+ ')';
};


export const hexaToRGBA = (hex: HexColor, percent = false): RGBColor => {
	let r: string | number = 0;
	let g: string | number = 0;
	let b: string | number = 0;
	let a: string | number = 1;

	if (hex.length == 5) {
		r = '0x' + hex[1] + hex[1];
		g = '0x' + hex[2] + hex[2];
		b = '0x' + hex[3] + hex[3];
		a = '0x' + hex[4] + hex[4];
	}
	else if (hex.length == 9) {
		r = '0x' + hex[1] + hex[2];
		g = '0x' + hex[3] + hex[4];
		b = '0x' + hex[5] + hex[6];
		a = '0x' + hex[7] + hex[8];
	}

	a = +(a as number / 255).toFixed(3);
	if (percent) {
		r = +(r as number / 255 * 100).toFixed(1);
		g = +(g as number / 255 * 100).toFixed(1);
		b = +(b as number / 255 * 100).toFixed(1);
		a = +(a * 100).toFixed(1);
	}

	return 'rgba('
		+ (percent
			? r + '%,' + g + '%,' + b + '%,' + a + '%'
			: +r + ',' + +g + ',' + +b + ',' + a)
		+ ')';
};
