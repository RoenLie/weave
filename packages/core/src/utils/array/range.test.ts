import { expect, test } from 'vitest';

import { range } from './range.js';


test('should create an array of the desired length', () => {
	const arr = range(50);

	expect(arr.length).toBe(50);
});
