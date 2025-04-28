import { expect, test } from 'vitest';

import { borderRadius } from './border-radius.ts';


test('a composed border radius should return the correct value', () => {
	expect(borderRadius('10px -8px 8px 10px')).toBe('border-radius:10px 0px 8px 10px');
});
