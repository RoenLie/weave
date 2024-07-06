import { globby } from 'globby';
import { paths } from '../../app/paths.ts';
import { performOCR } from '../ocr/perform-ocr.ts';
import { OCRModel, type IOCRModel } from '../ocr/ocr-model.ts';
import { basename, dirname } from 'node:path/posix';
import { Query } from '@roenlie/sqlite-wrapper';
import { ocrDbPath, ocrTable } from '../ocr/ocr-table.ts';
import { insertOCRDataToWeaviate } from '../ocr/ocr-weaviate.ts';
import { mkdir, rename, rmdir } from 'node:fs/promises';
import { UploadQueueModel, uploadQueueTable, type IUploadQueueModel } from './upload-queue.ts';


export const parseUploads = async () => {
	// Retrieve all files currently in the temp upload folder.
	let files = await globby(paths.tempUploads + '/**', {
		globstar:  true,
		onlyFiles: true,
	});

	// Check if any of the files are currently being processed.
	using query = new Query(ocrDbPath);
	const queueQuery = query.from<IUploadQueueModel>(uploadQueueTable);
	console.log('retrieveing queued files', queueQuery.queryAsString);

	const currentlyProcessedFiles = queueQuery.query().map(f => f.path);

	// remove any files already being processed.
	files = files.filter(file => !currentlyProcessedFiles.includes(file));

	// Add the new files into the queue.
	files.forEach(file => {
		const q = query.insert<IUploadQueueModel>(uploadQueueTable)
			.values(UploadQueueModel.initialize({ path: file }));

		console.log('inserting queue data', q.queryAsString);
		q.query();
	});

	// Perform the OCR of the uploaded files.
	const [ ocrResult, ocrErr ] = await performOCR('eng', files);
	if (ocrErr)
		return console.error(ocrErr);

	// Create the ocr models for database insertion.
	const ocrData = files.map((path, i) => {
		const file = basename(path);
		const dir = dirname(path).split('/').at(-1);

		return OCRModel.initialize({
			hash: dir!,
			name: file,
			text: ocrResult[i]!.data.text!,
		});
	});

	// Insert the ocr data into sqlite.
	ocrData.forEach(data => {
		const q = query.insert<IOCRModel>(ocrTable).values(data);
		console.log('insert ocr data', q.queryAsString);

		q.query();
	});

	// Insert the parsed ocr data into weaviate.
	const [ _, weaviateErr ] = await insertOCRDataToWeaviate(ocrData
		.map(({ hash, text, name }) => ({ hash, text, name })));

	if (weaviateErr)
		return console.error(weaviateErr);

	// move the processed files to the long real upload directory.
	await Promise.all(files.map(async (file) => {
		const from = file;
		const to = file.replace(paths.tempUploads, paths.uploads);

		return mkdir(dirname(to), { recursive: true })
			.then(() => rename(from, to));
	}));

	// get all unique folders.
	const folders = files.reduce((acc, cur) => {
		return acc.add(dirname(cur)), acc;
	}, new Set<string>());

	// remove any now empty folders.
	await Promise.all([ ...folders ].map(async folder => rmdir(folder)));

	// remove the processed files from the queue table.
	const uploadQuery = query.delete<IUploadQueueModel>(uploadQueueTable)
		.where(filter => filter.oneOf('path', ...files));

	console.log('remove processed files from queue table.', uploadQuery.queryAsString);

	uploadQuery.query();
};
