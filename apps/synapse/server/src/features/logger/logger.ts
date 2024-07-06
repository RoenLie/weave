import pino from 'pino';
import { paths } from '../../app/paths.ts';
import { fileURLToPath } from 'node:url';


const transport = pino.transport({
	level:   'info',
	target:  fileURLToPath(import.meta.resolve('./transport.mjs')),
	options: {
		append:    true,
		size:      '10M',
		interval:  '1d',
		compress:  'gzip',
		directory: paths.log,
	},
});


export const logger = pino(transport);
