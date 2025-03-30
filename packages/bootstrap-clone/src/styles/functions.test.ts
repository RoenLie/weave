import { describe, expect, it } from 'vitest';

import { luminance } from './functions';


describe('luminance', () => {
	// Test hex colors
	it('calculates luminance for hex colors', () => {
		expect(luminance('#ffffff')).toBeCloseTo(1);
		expect(luminance('#000000')).toBeCloseTo(0);
		expect(luminance('#ff0000')).toBeCloseTo(0.2126);
		expect(luminance('#00ff00')).toBeCloseTo(0.7152);
		expect(luminance('#0000ff')).toBeCloseTo(0.0722);
		expect(luminance('#808080')).toBeCloseTo(0.216);
	});

	// Test hex colors with alpha
	it('calculates luminance for hex colors with alpha', () => {
		expect(luminance('#ffffffff')).toBeCloseTo(1);
		expect(luminance('#000000ff')).toBeCloseTo(0);
	});

	// Test RGB colors
	it('calculates luminance for RGB colors', () => {
		expect(luminance('rgb(255, 255, 255)')).toBeCloseTo(1);
		expect(luminance('rgb(0, 0, 0)')).toBeCloseTo(0);
		expect(luminance('rgb(255, 0, 0)')).toBeCloseTo(0.2126);
		expect(luminance('rgb(0, 255, 0)')).toBeCloseTo(0.7152);
		expect(luminance('rgb(0, 0, 255)')).toBeCloseTo(0.0722);
		expect(luminance('rgb(128, 128, 128)')).toBeCloseTo(0.216);
	});

	// Test RGBA colors
	it('calculates luminance for RGBA colors', () => {
		expect(luminance('rgba(255, 255, 255, 0.5)')).toBeCloseTo(1);
		expect(luminance('rgba(0, 0, 0, 0.5)')).toBeCloseTo(0);
	});
});
