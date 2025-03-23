import { describe, expect, test } from 'vitest';

import { hexaToRGBA, hexToRGB } from './from-hex.ts';


describe('hexToRgb', () => {
	test('correctly converts hex to rgb', () => {
		const hex = '#0000ff';
		const rgb = hexToRGB(hex);
		expect(rgb).toBe('rgb(0,0,255)');
	});

	test('correctly converts hex to rgb with percent', () => {
		const hex = '#0000ff';
		const rgb = hexToRGB(hex, true);
		expect(rgb).toBe('rgb(0%,0%,100%)');
	});
});


describe('hexaToRGBA', () => {
	test('correctly converts hexa to rgba', () => {
		const hex = '#0000ff80';
		const rgba = hexaToRGBA(hex);
		expect(rgba).toBe('rgba(0,0,255,0.502)');
	});

	test('correctly converts hexa to rgba with percent', () => {
		const hex = '#0000ff80';
		const rgba = hexaToRGBA(hex, true);
		expect(rgba).toBe('rgba(0%,0%,100%,50.2%)');
	});
});
