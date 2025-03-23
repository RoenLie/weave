import { describe, expect, test } from 'vitest';

import { hexToRGBA } from './from-hex.ts';


describe('hexToRGBA', () => {
	test('correctly converts hex to rgba', () => {
		expect(hexToRGBA('#0000ff')).toEqual([ 0, 0, 255, 1 ]);
	});

	test('correctly converts hexa to rgba', () => {
		expect(hexToRGBA('#0000ff80')).toEqual([ 0, 0, 255, 0.502 ]);
	});
});
