import { describe, expect, it } from 'vitest';

import { getObjectDiff } from './object-diff.ts';


describe('ObjectDiff', () => {
	it('should be able to diff two objects', () => {
		const obj1 = {
			a: 1,
			b: 2,
			c: 3,
		};
		const obj2 = {
			a: 1,
			b: 3,
			d: 4,
		};

		const diff = getObjectDiff(obj1, obj2);

		expect(diff).toEqual({
			added:   { d: 4 },
			removed: { c: 3 },
			changed: { b: [ 2, 3 ] },
		});
	});
});
