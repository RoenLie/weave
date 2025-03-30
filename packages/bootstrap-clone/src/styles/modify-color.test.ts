import { describe, expect, it } from 'vitest';

import { shadeColor, tintColor } from './modify-color';


describe('modify-color', () => {
	// Setup some standard colors for testing
	const red = '#ff0000';
	const blue = '#0000ff';
	const green = '#00ff00';

	describe('tintColor', () => {
		it('should return white when weight is 0%', () => {
			expect(tintColor(red, 0)).toEqual([ 255, 255, 255, 1 ]);
			expect(tintColor(blue, 0)).toEqual([ 255, 255, 255, 1 ]);
		});

		it('should return the original color when weight is 100%', () => {
			expect(tintColor(red, 100)).toEqual([ 255, 0, 0, 1 ]);
			expect(tintColor(blue, 100)).toEqual([ 0, 0, 255, 1 ]);
		});

		it('should properly mix color with white at 50%', () => {
			// Red mixed with white at 50% should be pink (255, 127.5, 127.5)
			expect(tintColor(red, 50)).toEqual([ 255, 128, 128, 1 ]);
			// Blue mixed with white at 50% should be light blue (127.5, 127.5, 255)
			expect(tintColor(blue, 50)).toEqual([ 128, 128, 255, 1 ]);
		});

		it('should handle different weight values correctly', () => {
			expect(tintColor(red, 25)).toEqual([ 255, 191, 191, 1 ]);
			expect(tintColor(green, 75)).toEqual([ 64, 255, 64, 1 ]);
		});
	});

	describe('shadeColor', () => {
		it('should return black when weight is 0%', () => {
			expect(shadeColor(red, 0)).toEqual([ 0, 0, 0, 1 ]);
			expect(shadeColor(blue, 0)).toEqual([ 0, 0, 0, 1 ]);
		});

		it('should return the original color when weight is 100%', () => {
			expect(shadeColor(red, 100)).toEqual([ 255, 0, 0, 1 ]);
			expect(shadeColor(blue, 100)).toEqual([ 0, 0, 255, 1 ]);
		});

		it('should properly mix color with black at 50%', () => {
			// Red mixed with black at 50% should be dark red (127.5, 0, 0)
			expect(shadeColor(red, 50)).toEqual([ 128, 0, 0, 1 ]);
			// Blue mixed with black at 50% should be dark blue (0, 0, 127.5)
			expect(shadeColor(blue, 50)).toEqual([ 0, 0, 128, 1 ]);
		});

		it('should handle different weight values correctly', () => {
			expect(shadeColor(red, 25)).toEqual([ 64, 0, 0, 1 ]);
			expect(shadeColor(green, 75)).toEqual([ 0, 191, 0, 1 ]);
		});
	});

	describe('edge cases', () => {
		it('should handle transparent colors', () => {
			expect(tintColor('rgba(255, 0, 0, 0.5)', 50)).toEqual([ 255, 170, 170, 0.75 ]);
			expect(shadeColor('rgba(0, 0, 255, 0.5)', 50)).toEqual([ 0, 0, 85, 0.75 ]);
		});

		it('should handle named colors', () => {
			expect(tintColor('red', 50)).toEqual([ 255, 128, 128, 1 ]);
			expect(shadeColor('blue', 50)).toEqual([ 0, 0, 128, 1 ]);
		});
	});
});
