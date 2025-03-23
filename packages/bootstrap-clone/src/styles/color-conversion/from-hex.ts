// https://css-tricks.com/converting-color-spaces-in-javascript/

import type { RGBA } from './from-rgb.ts';

export type HexColor = string & Record<never, never>;

export const isHex = (color: string): color is HexColor => /^#([0-9a-f]{3}){1,2}([0-9a-f]{2})?$/i.test(color);

export const hexToRGBA = (hex: HexColor): RGBA => {
	let r: string | number = 0;
	let g: string | number = 0;
	let b: string | number = 0;
	let a: string | number = 1;

	// 3 digits, without alpha
	if (hex.length == 4) {
		r = '0x' + hex[1] + hex[1];
		g = '0x' + hex[2] + hex[2];
		b = '0x' + hex[3] + hex[3];
	}
	// 6 digits, without alpha
	else if (hex.length == 7) {
		r = '0x' + hex[1] + hex[2];
		g = '0x' + hex[3] + hex[4];
		b = '0x' + hex[5] + hex[6];
	}
	// 4 digits, with alpha
	else if (hex.length == 5) {
		r = '0x' + hex[1] + hex[1];
		g = '0x' + hex[2] + hex[2];
		b = '0x' + hex[3] + hex[3];
		a = '0x' + hex[4] + hex[4];

		a = +(Number(a) / 255).toFixed(3);
	}
	// 8 digits, with alpha
	else if (hex.length == 9) {
		r = '0x' + hex[1] + hex[2];
		g = '0x' + hex[3] + hex[4];
		b = '0x' + hex[5] + hex[6];
		a = '0x' + hex[7] + hex[8];

		a = +(Number(a) / 255).toFixed(3);
	}

	// the + symbols before the variables (+r, +g, +b) are necessary because
	// they function as the unary plus operator that converts the values
	// from hexadecimal strings to decimal numbers.
	return [ +r, +g, +b, a ];
};
