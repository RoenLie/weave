import { bench, describe, expect, it } from 'vitest';

import { Loop } from './Loop.js';


const mySlowFunction = (baseNumber: number) => {
	let result = 0; result;
	for (let i = Math.pow(baseNumber, 7); i >= 0; i--)
		result += Math.atan(i) * Math.tan(i);
};


describe('functional comparisons', () => {
	bench('Functional loop', () => {
		Loop((state) => {
			mySlowFunction(2);
			state.counter++;

			return state.counter < 50000;
		}, { counter: 0 });
	});

	bench('Imperative loop', () => {
		let counter = 0;

		while (counter < 50000) {
			mySlowFunction(2);
			counter ++;
		}
	});
});
