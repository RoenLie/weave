import { describe, it } from 'vitest';

import { augment } from '../../src/node-tree/augment.js';


describe('thing', () => {
	it('should', () => {
		const obj = {
			first:    1,
			last:     2,
			children: [],
		};

		const augmented = augment(obj, 'children');
		console.log(augmented);
	});
});
