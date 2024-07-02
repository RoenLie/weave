import type { RequestHandler } from 'express';
import { createModulesDemoData } from 'src/features/modules/modules-table.js';
import { createUsersDemoData } from 'src/features/user/user-table.js';


export const get: RequestHandler[] = [
	(req, res) => {
		type ValidName = 'users' | 'modules';
		const { name } = req.query as { name: ValidName; };

		if (name === 'users')
			createUsersDemoData();
		if (name === 'modules')
			createModulesDemoData();

		res.sendStatus(200);
	},
];
