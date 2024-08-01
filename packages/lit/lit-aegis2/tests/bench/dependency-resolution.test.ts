import { describe, expect, it } from 'vitest';

import { iteration } from './dependency-resolution.mock.js';


describe('Testing dependency resolution strategies', () => {
	const expected = [ 'database', 'entity' ];

	it('Iteration should give the correct dependencies', () => {
		const actual = iteration([ 'SYS.CORP.ROOT' ], 'database');

		expect(expected).toStrictEqual(actual);
	});
});
