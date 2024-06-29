import type { ExpressController } from '../../src/utilities/file-routes.ts';
import formidable from 'formidable';
import { maybe } from '../../src/utilities/maybe.ts';


export default [
	{
		path:     '/api/capture/upload',
		method:   'post',
		handlers: [
			async (req, res, next) => {
				const form = formidable({});

				const [ result, error ] = await maybe(form.parse(req));
				if (error)
					return next();

				const [ _, files ] = result;

				res.json({ files });
			},
		],
	},
] as ExpressController;
