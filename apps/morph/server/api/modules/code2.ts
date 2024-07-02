import type { RequestHandler } from 'express';


export const get: RequestHandler[] = [
	(req, res) => {
		res.send(`
		import { secrets } from 'db:code1';

		export const test = () => {
			console.log('If you see this, this code has access to local scope');

			throw('THIS IS A THROW');

			return 'I am a function from the server. ' + secrets;
		};
		`);
	},
];
