import { format } from '@roenlie/core/string';
import { expect, test } from 'vitest';

import { term } from '../../src/core/localize-core.js';


test('Set and request a syncronous term', async () => {
	const [ promise, code ] = term('hello', str => format(str, 'PICKLE', 'PUCKLE'));
	console.log(await promise);
});
