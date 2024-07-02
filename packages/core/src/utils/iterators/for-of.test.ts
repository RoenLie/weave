import { expect, test } from 'vitest';

import { forOf } from './for-of.js';


test('returns the first entry of the number 5', () => {
	const result = forOf([ 1, 2, 3 ], [ 4, 5 ]).find((v) => v === 5);

	expect(result).toBe(5);
});

test('iterates through all items, incrementing the counter', () => {
	let count = 0;

	forOf([ 1, 2, 3 ], [ 4, 5 ]).forEach(() => count++);

	expect(count).toBe(5);
});

test('iterates through all items, returns an array with the return values', () => {
	const result = forOf([ '', '', '' ], [ '', '' ]).map((_, i) => i);
	expect(result).to.be.deep.equals([ 0, 1, 2, 0, 1 ]);
});

test('return true if the value is found in the input', () => {
	const exists = forOf([ 1, 2, 3 ], [ 4, 5 ]).includes(3);
	expect(exists).toBe(true);
});

test('return true if all predicates return true', () => {
	const every = forOf([ 1, 1, 1 ], [ 1, 1 ]).every(v => v === 1);
	expect(every).toBe(true);
});

test('return true if one predicate returns true', () => {
	const some = forOf([ 1, 2, 3 ], [ 4, 5 ]).some(v => v === 2);
	expect(some).toBe(true);
});

test('combine all numbers', () => {
	const sum = forOf([ 1, 1, 1 ], [ 1, 1 ]).reduce((acc, cur) => {
		return acc += cur;
	}, 0);
	expect(sum).toBe(5);
});
