import { describe, expect, it } from 'vitest';

import { type Change, getObjectDiff } from './object-diff.ts';


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
		expect(diff).toEqual([
			{
				path:     'b',
				oldValue: 2,
				newValue: 3,
			},
			{
				path:     'c',
				oldValue: 3,
				newValue: undefined,
			},
			{
				path:     'd',
				oldValue: undefined,
				newValue: 4,
			},
		] satisfies Change[]);
	});

	it('should be able to diff two objects with nested properties', () => {
		const obj1 = {
			a: 1,
			b: {
				c: 2,
				d: 3,
			},
		};
		const obj2 = {
			a: 1,
			b: {
				c: 3,
				e: 4,
			},
		};

		const diff = getObjectDiff(obj1, obj2);
		expect(diff).toEqual([
			{
				path:     'b.c',
				oldValue: 2,
				newValue: 3,
			},
			{
				path:     'b.d',
				oldValue: 3,
				newValue: undefined,
			},
			{
				path:     'b.e',
				oldValue: undefined,
				newValue: 4,
			},
		] satisfies Change[]);
	});

	it('should be able to diff two objects with arrays', () => {
		const obj1 = {
			a: 1,
			b: [ 1, 2, 3 ],
			c: {
				d: 4,
				e: [ 5, 6 ],
			},
		};
		const obj2 = {
			a: 1,
			b: [ 1, 2, 4 ],
			c: {
				d: 4,
				e: [ 5, 7 ],
			},
		};

		const diff = getObjectDiff(obj1, obj2);
		expect(diff).toEqual([
			{
				newValue: 4,
				oldValue: 3,
				path:     'b.2',
			},
			{
				newValue: 7,
				oldValue: 6,
				path:     'c.e.1',
			},
		] satisfies Change[]);
	});
});
