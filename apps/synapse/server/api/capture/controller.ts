import type { ControllerMethod, ExpressController } from '../../src/utilities/file-routes.ts';
import { join } from 'path/posix';
import formidable from 'formidable';
import { mkdir, rename } from 'fs/promises';
import { maybe } from '../../src/utilities/maybe.ts';
import { paths } from '../../src/app/paths.ts';
import { performOCR } from '../../src/features/ocr/perform-ocr.ts';
import { OCRModel, type IOCRModel } from '../../src/features/ocr/ocr-model.ts';
import { Query } from '@roenlie/sqlite-wrapper';
import { ocrDbPath, ocrTable } from '../../src/features/ocr/ocr-table.ts';
import { maybeAll } from '@roenlie/core/async';


const upload: ControllerMethod = {
	path:     '/api/capture/upload',
	method:   'post',
	handlers: [
		async (req, res, next) => {
			const form = formidable();

			const [ result, error ] = await maybe(form.parse(req));
			if (error)
				return next();

			const [ fields, files ] = result;

			const hash = fields['hash']![0]!;
			const modifiedFiles: Promise<formidable.File>[] = [];

			for (const [ name, value ] of Object.entries(files)) {
				const file = value?.at(0);
				if (!file)
					continue;

				const ext = file.mimetype!.split('/').at(-1)!;
				const oldFilepath = file.filepath;

				file.originalFilename = name;
				file.newFilename      = `${ name }_${ file.newFilename }.${ ext }`;

				const dir = join(paths.uploads.replaceAll('\\', '/'), hash);
				file.filepath = join(dir, file.newFilename);

				modifiedFiles.push(
					mkdir(dir, { recursive: true }).then(() =>
						rename(oldFilepath, file.filepath).then(() =>
							({ ...file }))),
				);
			}

			const [ resolvedFiles, err ] = await maybeAll(modifiedFiles);
			if (err)
				return console.error('Failed to save received files.', { cause: err });

			// We respond to client here.
			// As OCR takes a long time, and there is no point for client to wait for it.
			// We remove the filepath prop as
			// we don't want the client to receive this information
			res.json({
				files: Object.entries(files).flatMap(([ _, files ]) => files?.map(f => {
					return f.filepath = '', f;
				})),
			});

			const ocrResult = await performOCR('eng', resolvedFiles.map(f => f.filepath));
			const ocrData = ocrResult.map((result, i) => OCRModel.initialize({
				hash,
				name: resolvedFiles[i]!.newFilename,
				text: result.data.text,
			}));

			using query = new Query(ocrDbPath);
			ocrData.forEach(data =>
				query.insert<IOCRModel>(ocrTable).values(data).query());
		},
	],
};


export default [ upload ] as ExpressController;
