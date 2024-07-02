import dImport from '@roenlie/morph/server/features/modules/dynamic-import.js';
import type { RequestHandler } from 'express';


export const get: RequestHandler[] = [
	async (req, res) => {
		const port = Number(process.env['PORT']);
		const host = process.env['HOST'];
		const path = 'http://' + host + ':' + port;

		try {
			const testModule = await dImport(
				path + '/api/modules/code2',
			);

			const result = testModule.test();
			res.send(result);
		}
		catch (error) {
			console.error(error);
			res.sendStatus(500);
		}
	},
];
