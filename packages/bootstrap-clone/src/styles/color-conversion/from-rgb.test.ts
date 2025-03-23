import { describe, expect, test } from 'vitest';

import { extractRGB, RGBtoHex, RGBtoHexa } from './from-rgb.ts';


describe('extract rgb from string', () => {
	test('extract rgb values', () => {
		expect(extractRGB('rgb(255,255,255)'))  .toEqual([ 255, 255, 255, 1 ]);
		expect(extractRGB('rgb(0,0,0)'))        .toEqual([ 0, 0, 0, 1 ]);
		expect(extractRGB('rgb(0, 0, 0)'))      .toEqual([ 0, 0, 0, 1 ]);
		expect(extractRGB('rgb(50%, 50%, 50%)')).toEqual([ 128, 128, 128, 1 ]);
		expect(extractRGB('rgb(50% 50% 50%)'))  .toEqual([ 128, 128, 128, 1 ]);
	});
	test('extract rgba values', () => {
		expect(extractRGB('rgb(0,0,0,0)'))           .toEqual([ 0, 0, 0, 0 ]);
		expect(extractRGB('rgba(255,255,255,1)'))    .toEqual([ 255, 255, 255, 1 ]);
		expect(extractRGB('rgb(0, 0, 0, 0)'))        .toEqual([ 0, 0, 0, 0 ]);
		expect(extractRGB('rgb(50% 50% 50% / 50%)')) .toEqual([ 128, 128, 128, 0.5 ]);
		expect(extractRGB('rgb(50%, 50%, 50%, 50%)')).toEqual([ 128, 128, 128, 0.5 ]);
	});
});

describe('RGB to Hex conversion', () => {
	test('convert RGB string to hex', () => {
		expect(RGBtoHex('rgb(255,255,255)')).toBe('#ffffff');
		expect(RGBtoHex('rgb(0,0,0)')).toBe('#000000');
		expect(RGBtoHex('rgb(255, 0, 0)')).toBe('#ff0000');
		expect(RGBtoHex('rgb(0, 255, 0)')).toBe('#00ff00');
		expect(RGBtoHex('rgb(0, 0, 255)')).toBe('#0000ff');
		expect(RGBtoHex('rgb(123, 45, 67)')).toBe('#7b2d43');
	});

	test('convert RGB components to hex', () => {
		expect(RGBtoHex(255, 255, 255)).toBe('#ffffff');
		expect(RGBtoHex(0, 0, 0)).toBe('#000000');
		expect(RGBtoHex(255, 0, 0)).toBe('#ff0000');
		expect(RGBtoHex(0, 255, 0)).toBe('#00ff00');
		expect(RGBtoHex(0, 0, 255)).toBe('#0000ff');
		expect(RGBtoHex(123, 45, 67)).toBe('#7b2d43');
	});

	test('handle single-digit hex values', () => {
		expect(RGBtoHex(9, 9, 9)).toBe('#090909');
		expect(RGBtoHex(0, 7, 15)).toBe('#00070f');
		expect(RGBtoHex('rgb(9, 9, 9)')).toBe('#090909');
	});
});

describe('RGBA to Hex conversion', () => {
	test('convert RGBA string to hex', () => {
		expect(RGBtoHexa('rgba(255,255,255,1)')).toBe('#ffffffff');
		expect(RGBtoHexa('rgba(0,0,0,0)')).toBe('#00000000');
		expect(RGBtoHexa('rgba(255, 0, 0, 0.5)')).toBe('#ff000080');
		expect(RGBtoHexa('rgba(0, 255, 0, 0.25)')).toBe('#00ff0040');
		expect(RGBtoHexa('rgba(0, 0, 255, 0.75)')).toBe('#0000ffbf');
	});

	test('convert RGBA components to hex', () => {
		expect(RGBtoHexa(255, 255, 255, 1)).toBe('#ffffffff');
		expect(RGBtoHexa(0, 0, 0, 0)).toBe('#00000000');
		expect(RGBtoHexa(255, 0, 0, 0.5)).toBe('#ff000080');
		expect(RGBtoHexa(0, 255, 0, 0.25)).toBe('#00ff0040');
		expect(RGBtoHexa(0, 0, 255, 0.75)).toBe('#0000ffbf');
	});

	test('handle single-digit hex values', () => {
		expect(RGBtoHexa(9, 9, 9, 0.05)).toBe('#0909090d');
		expect(RGBtoHexa(0, 7, 15, 0)).toBe('#00070f00');
		expect(RGBtoHexa('rgba(9, 9, 9, 0.05)')).toBe('#0909090d');
	});
});
