import type { ExpressController } from '../../src/utilities/file-routes.ts';
import { join } from 'path/posix';
import formidable from 'formidable';
import { rename } from 'fs/promises';
import { maybe } from '../../src/utilities/maybe.ts';
import { paths } from '../../src/app/paths.ts';
import { performOCR } from '../../src/features/ocr/perform-ocr.ts';


export default [
	{
		path:     '/api/capture/upload',
		method:   'post',
		handlers: [
			async (req, res, next) => {
				const form = formidable();

				const [ result, error ] = await maybe(form.parse(req));
				if (error)
					return next();

				const [ _, files ] = result;

				const entries = Object.entries(files);
				const resolvedFiles = await Promise.all(entries.map(async ([ name, value ]) => {
					const file = value?.at(0);
					if (!file)
						return;

					const ext = file.mimetype!.split('/').at(-1)!;
					const oldFilepath = file.filepath;

					file.originalFilename = file.newFilename;
					file.newFilename      = `${ name }_${ file.newFilename }.${ ext }`;
					file.filepath = join(paths.uploads.replaceAll('\\', '/'), file.newFilename);

					await rename(oldFilepath, file.filepath);

					return file;
				})).then(r => r.filter(f => f !== undefined));

				const ocrResult = await performOCR('eng', ...resolvedFiles.map(f => f.filepath));

				res.json({ files });
			},
		],
	},
] as ExpressController;
