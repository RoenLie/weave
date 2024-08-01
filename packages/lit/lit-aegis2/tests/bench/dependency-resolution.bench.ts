import { bench, describe } from 'vitest';

import { iteration, recursion } from './dependency-resolution.mock.js';


describe('Test Suite description', () => {
	bench('recursion', () => {
		recursion([ 'SYS.CORP.ROOT' ], 'utilities');
	});

	bench('iteration', () => {
		iteration([ 'SYS.CORP.ROOT' ], 'utilities');
	});
});
