import { bench } from 'vitest';

import { range } from '../array/range.js';
import { forOf } from './for-of.js';


const arr = range(100);

bench('iterating using function', () => {
	forOf(arr, arr).forEach(() => {});
});

bench('iterating using native', () => {
	const fn = () => {};
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	for (const _ of arr)
		fn();
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	for (const _ of arr)
		fn();
});
