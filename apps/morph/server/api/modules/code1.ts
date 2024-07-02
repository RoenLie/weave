import type { RequestHandler } from 'express';


export const get: RequestHandler[] = [
	(req, res) => {
		res.send(`
		console.log('I AM FROM /api/modules/code1');

		export const secrets = 'this is a secret';
		`);
	},
];
