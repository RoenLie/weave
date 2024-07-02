import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { describe, it } from 'vitest';

import { markdownIt } from '../../src/server/build/markdown/markdown-it.js';


describe('suite', () => {
	it('should convert markdown', () => {
		const markdowncontent = readFileSync(join(resolve(), 'tests', 'path', 'testfile.md'), { encoding: 'utf-8' });

		const result = markdownIt.render(markdowncontent);
		console.log(result);
	});
});
