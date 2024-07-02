import type { IModule } from '@roenlie/morph/models/modules-model.js';
import type { RequestHandler } from 'express';
import { deleteModule, moduleExists } from 'src/features/modules/modules-behavior.js';


export const post: RequestHandler[] = [
	(req, res) => {
		const module = req.body as IModule;

		if (!moduleExists(module))
			return res.sendStatus(404);

		deleteModule(module);

		if (moduleExists(module))
			return res.sendStatus(500);

		return res.sendStatus(200);
	},
];
