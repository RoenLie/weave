import { Query } from '@roenlie/morph/server/features/sqlite/query.js';
import { tableExists } from '@roenlie/morph/server/features/sqlite/table-exists.js';
import type { RequestHandler } from 'express';


export const get: RequestHandler[] = [
	(req, res) => {
		const { name } = req.query as { name: string; };

		let items: object[] = [];
		if (name && tableExists(name)) {
			using query = new Query();
			items = query.from(name).query();
		}

		res.statusCode = 200;
		res.send(items);
	},
];
