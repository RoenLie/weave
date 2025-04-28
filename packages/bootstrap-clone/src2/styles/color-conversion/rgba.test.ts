import { describe, expect, test } from 'vitest';

import { RGBA } from './rgba.ts';


describe('RGBA from string', () => {
	test('extract rgb values', () => {
		expect(RGBA.fromString('rgb(255,255,255)'))  .toEqual([ 255, 255, 255, 1 ]);
		expect(RGBA.fromString('rgb(0,0,0)'))        .toEqual([ 0, 0, 0, 1 ]);
		expect(RGBA.fromString('rgb(0, 0, 0)'))      .toEqual([ 0, 0, 0, 1 ]);
		expect(RGBA.fromString('rgb(50%, 50%, 50%)')).toEqual([ 128, 128, 128, 1 ]);
		expect(RGBA.fromString('rgb(50% 50% 50%)'))  .toEqual([ 128, 128, 128, 1 ]);
	});
	test('extract rgba values', () => {
		expect(RGBA.fromString('rgb(0,0,0,0)'))           .toEqual([ 0, 0, 0, 0 ]);
		expect(RGBA.fromString('rgba(255,255,255,1)'))    .toEqual([ 255, 255, 255, 1 ]);
		expect(RGBA.fromString('rgb(0, 0, 0, 0)'))        .toEqual([ 0, 0, 0, 0 ]);
		expect(RGBA.fromString('rgb(50% 50% 50% / 50%)')) .toEqual([ 128, 128, 128, 0.5 ]);
		expect(RGBA.fromString('rgb(50%, 50%, 50%, 50%)')).toEqual([ 128, 128, 128, 0.5 ]);
	});
});


describe('RGB to Hex conversion', () => {
	test('convert RGB string to hex', () => {
		expect(RGBA.fromString('rgb(255,255,255)').toHexString()).toBe('#ffffff');
		expect(RGBA.fromString('rgb(0,0,0)').toHexString()).toBe('#000000');
		expect(RGBA.fromString('rgb(255, 0, 0)').toHexString()).toBe('#ff0000');
		expect(RGBA.fromString('rgb(0, 255, 0)').toHexString()).toBe('#00ff00');
		expect(RGBA.fromString('rgb(0, 0, 255)').toHexString()).toBe('#0000ff');
		expect(RGBA.fromString('rgb(123, 45, 67)').toHexString()).toBe('#7b2d43');
	});

	test('handle single-digit hex values', () => {
		expect(RGBA.fromString('rgb(0, 7, 15)').toHexString()).toBe('#00070f');
		expect(RGBA.fromString('rgb(9, 9, 9)').toHexString()).toBe('#090909');
	});
});


describe('RGBA to Hex conversion', () => {
	test('convert RGBA string to hex', () => {
		expect(RGBA.fromString('rgba(255,255,255,1)').toHexaString()).toBe('#ffffffff');
		expect(RGBA.fromString('rgba(0,0,0,0)').toHexaString()).toBe('#00000000');
		expect(RGBA.fromString('rgba(255, 0, 0, 0.5)').toHexaString()).toBe('#ff000080');
		expect(RGBA.fromString('rgba(0, 255, 0, 0.25)').toHexaString()).toBe('#00ff0040');
		expect(RGBA.fromString('rgba(0, 0, 255, 0.75)').toHexaString()).toBe('#0000ffbf');
	});

	test('Cannot handle low opacity values due to lossy canvas', () => {
		expect(RGBA.fromString('rgba(9, 9, 9, 0.05)').toHexaString()).toBe('#0000000d');
	});
});


describe('Hex to RGBA', () => {
	test('correctly converts hex to rgba', () => {
		expect(RGBA.fromString('#0000ff')).toEqual([ 0, 0, 255, 1 ]);
	});

	test('correctly converts hexa to rgba', () => {
		expect(RGBA.fromString('#0000ff80')).toEqual([ 0, 0, 255, 0.50 ]);
	});
});
