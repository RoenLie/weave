import { SQLite } from '@roenlie/morph/server/features/sqlite/database.js';
import type { RequestHandler } from 'express';


export const get: RequestHandler[] = [
	(req, res) => {
		const { name } = req.query as { name: string; };

		const validTables = [ 'users', 'OTP', 'modules' ];

		if (validTables.includes(name)) {
			using db = new SQLite();
			db.prepare(/* sql */`
			DROP TABLE ${ name }
			`).run();
		}

		res.send(200);
	},
];
