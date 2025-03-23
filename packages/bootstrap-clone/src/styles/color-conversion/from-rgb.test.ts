import { describe, expect, test } from 'vitest';

import { extractRGB, isRGB, isRGBA, RGBAtoHex, RGBtoHex } from './from-rgb.ts';


describe('validate rgb', () => {
	test('valid rgb values', () => {
		expect(isRGB('rgb(255,255,255)')).toBe(true);
		expect(isRGB('rgb(123,45,67)')).toBe(true);
		expect(isRGB('rgb(0,0,0)')).toBe(true);
		expect(isRGB('rgb(0, 0, 0)')).toBe(true);
	});

	test('invalid rgb values', () => {
		expect(isRGB('rgb(256,0,0)')).toBe(false);
		expect(isRGB('rgb(0,256,0)')).toBe(false);
		expect(isRGB('rgb(0,0,256)')).toBe(false);
		expect(isRGB('rgb(-1,0,0)')).toBe(false);
		expect(isRGB('rgb(0,0)')).toBe(false);
		expect(isRGB('rgb(0,0,0,0)')).toBe(false);
		expect(isRGB('rgba(0,0,0,0)')).toBe(false);
		expect(isRGB('rgb(0.5,0,0)')).toBe(false);
		expect(isRGB('notrgb')).toBe(false);
	});
});

describe('validate rgba', () => {
	test('basic rgba format', () => {
		expect(isRGBA('rgba(0,0,0,0)')).toBe(true);
		expect(isRGBA('rgba(0, 0, 0, 0)')).toBe(true);
		expect(isRGBA('rgba(255,255,255,1)')).toBe(true);
	});

	test('rgba with decimal alpha', () => {
		expect(isRGBA('rgba(123,45,67,0.5)')).toBe(true);
		expect(isRGBA('rgba(0,0,0,0.25)')).toBe(true);
		expect(isRGBA('rgba(0,0,0,0.999)')).toBe(true);
	});

	test('invalid rgba values', () => {
		expect(isRGBA('rgba(256,0,0,0)')).toBe(false);
		expect(isRGBA('rgba(0,256,0,0)')).toBe(false);
		expect(isRGBA('rgba(0,0,256,0)')).toBe(false);
		expect(isRGBA('rgba(0,0,0,2)')).toBe(false);
		expect(isRGBA('rgba(0,0,0,-0.5)')).toBe(false);
		expect(isRGBA('rgba(0,0,0)')).toBe(false);
		expect(isRGBA('rgb(0,0,0)')).toBe(false);
		expect(isRGBA('notrgba')).toBe(false);
	});
});

describe('extract rgb from string', () => {
	test('extract rgb values', () => {
		expect(extractRGB('rgb(255,255,255)')).toEqual([ 255, 255, 255 ]);
		expect(extractRGB('rgb(0,0,0)')).toEqual([ 0, 0, 0 ]);
		expect(extractRGB('rgb(0, 0, 0)')).toEqual([ 0, 0, 0 ]);
	});
	test('extract rgba values', () => {
		expect(extractRGB('rgba(255,255,255,1)', true)).toEqual([ 255, 255, 255, 1 ]);
		expect(extractRGB('rgba(0,0,0,0)', true)).toEqual([ 0, 0, 0, 0 ]);
		expect(extractRGB('rgba(0, 0, 0, 0)', true)).toEqual([ 0, 0, 0, 0 ]);
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
		expect(RGBAtoHex('rgba(255,255,255,1)')).toBe('#ffffffff');
		expect(RGBAtoHex('rgba(0,0,0,0)')).toBe('#00000000');
		expect(RGBAtoHex('rgba(255, 0, 0, 0.5)')).toBe('#ff000080');
		expect(RGBAtoHex('rgba(0, 255, 0, 0.25)')).toBe('#00ff0040');
		expect(RGBAtoHex('rgba(0, 0, 255, 0.75)')).toBe('#0000ffbf');
	});

	test('convert RGBA components to hex', () => {
		expect(RGBAtoHex(255, 255, 255, 1)).toBe('#ffffffff');
		expect(RGBAtoHex(0, 0, 0, 0)).toBe('#00000000');
		expect(RGBAtoHex(255, 0, 0, 0.5)).toBe('#ff000080');
		expect(RGBAtoHex(0, 255, 0, 0.25)).toBe('#00ff0040');
		expect(RGBAtoHex(0, 0, 255, 0.75)).toBe('#0000ffbf');
	});

	test('handle single-digit hex values', () => {
		expect(RGBAtoHex(9, 9, 9, 0.05)).toBe('#0909090d');
		expect(RGBAtoHex(0, 7, 15, 0)).toBe('#00070f00');
		expect(RGBAtoHex('rgba(9, 9, 9, 0.05)')).toBe('#0909090d');
	});
});
