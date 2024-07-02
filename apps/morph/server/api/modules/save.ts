import type { IModule } from '@roenlie/morph/models/modules-model.js';
import type { RequestHandler } from 'express';
import { getByID, updateModule } from 'src/features/modules/modules-behavior.js';


export const post: RequestHandler[] = [
	(req, res) => {
		const { returnModule } = req.query as { returnModule: string; };
		const module = req.body as IModule;

		const result = updateModule(module);
		if (!result)
			return res.sendStatus(500);

		if (returnModule) {
			res.status(200);

			return res.send(getByID(module.module_id));
		}

		return res.sendStatus(200);
	},
];
