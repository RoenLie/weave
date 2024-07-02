import { describe, it } from 'vitest';

import { findNakedSubset } from './find-naked-subset.js';


describe('should finally work', () => {
	it('naked double', () => {
		const input = [
			[ 1, 2 ],
			[ 1, 2 ],
			[ 1, 2, 3 ],
			[ 3, 4, 5 ],
			[ 4, 5, 6 ],
			[ 3, 6, 7 ],
			[ 7, 8 ],
			[ 8, 9 ],
			[ 9 ],
		];

		const result = findNakedSubset(input, 2);

		//expect(result).to.deep.equal([ 1, 2 ]);
	});

	it('naked tripple', () => {
		const input = [
			[ 1, 2, 3 ],
			[ 1, 3 ],
			[ 2, 3 ],
			[ 4, 5, 6 ],
			[ 4, 5 ],
			[ 4, 6, 7 ],
			[ 7, 8, 9 ],
			[ 8, 9 ],
			[ 8 ],
		];

		const result = findNakedSubset(input, 3);
	});

	it('naked quad', () => {
		const input = [
			[ 1, 2, 3, 4 ],
			[ 1, 2, 3 ],
			[ 1, 3, 4 ],
			[ 2, 3, 4 ],
			[ 1, 2, 3, 4, 5 ],
			[ 5, 6, 7 ],
			[ 6, 7, 8 ],
			[ 7, 8, 9 ],
			[ 8, 9 ],
		];


		const result = findNakedSubset(input, 4);
	});
});
