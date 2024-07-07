import type { ControllerMethod, ExpressController } from '@roenlie/synapse-server/utilities/file-routes.ts';
import { join } from 'path/posix';
import formidable from 'formidable';
import { mkdir, readFile, rename } from 'fs/promises';
import { maybe, maybeAll } from '@roenlie/core/async';
import { paths } from '@roenlie/synapse-server/app/paths.ts';
import { searchOCRData, ocrDataSchema } from '@roenlie/synapse-server/features/ocr/ocr-weaviate.ts';
import { parseUploads } from '../../src/features/capture/parse-uploads.ts';
import { logger } from '../../src/features/logger/logger.ts';


const clearAllData = async () => {
	const [
		{ Query },
		{ deleteCollection },
		{ getWeaviateDb },
		{ ocrDbPath, ocrTable },
		{ uploadQueueTable },
	] = await Promise.all([
		import('@roenlie/sqlite-wrapper'),
		import('../../src/features/vectordb/create-collection.ts'),
		import('../../src/features/vectordb/get-weaviate-db.ts'),
		import('../../src/features/ocr/ocr-table.ts'),
		import('../../src/features/capture/upload-queue.ts'),
	]);

	using query = new Query(ocrDbPath);
	query.delete(ocrTable).query();
	query.delete(uploadQueueTable).query();
	await using weaviate  = await getWeaviateDb();
	deleteCollection(weaviate.client, ocrDataSchema.class);
};


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
			const modifiedFiles: Promise<void>[] = [];

			for (const [ name, value ] of Object.entries(files)) {
				const file = value?.at(0);
				if (!file)
					continue;

				const ext = file.mimetype!.split('/').at(-1)!;
				const oldFilepath = file.filepath;

				file.originalFilename = name;
				file.newFilename      = `${ name }_${ file.newFilename }.${ ext }`;

				const dir = join(paths.tempUploads.replaceAll('\\', '/'), hash);
				file.filepath = join(dir, file.newFilename);

				modifiedFiles.push(mkdir(dir, { recursive: true }).then(() =>
					rename(oldFilepath, file.filepath)));
			}

			const [ _, err ] = await maybeAll(modifiedFiles);
			if (err)
				return console.error('Failed to save received files.', { cause: err });

			// We respond to client here.
			// As OCR takes a long time, and there is no point for client to wait for it.
			res.sendStatus(200);

			await parseUploads();

			return;
		},
	],
};


const search: ControllerMethod = {
	path:     '/api/search',
	method:   'get',
	handlers: [
		async (req, res, _next) => {
			const { query } = req.query as {
				query: string;
			};

			const [ searchResult, searchErr ] = await maybe(searchOCRData(query));
			if (searchErr) {
				console.error(searchErr);

				return res.sendStatus(500);
			}

			const [ files, err ] = await maybeAll(searchResult.objects.map(async result => {
				const { hash, name } = result.properties;
				const path = join(paths.uploads, hash, name);

				return readFile(path, 'base64');
			}));

			if (err) {
				console.log(err);

				return res.sendStatus(500);
			}

			console.dir(searchResult.objects.map(obj => ({
				...obj,
				properties: [],
			})), { depth: 5 });

			res.send({ query, files, error: undefined });
		},
	],
};


const logging: ControllerMethod = {
	path:     '/api/capture/log',
	method:   'get',
	handlers: [
		(_req, res) => {
			logger.info('what about this?');

			res.sendStatus(200);
		},
	],
};


export default [
	upload,
	search,
	logging,
] as ExpressController;
