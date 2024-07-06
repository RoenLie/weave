import { globby } from 'globby';
import { paths } from '../../src/app/paths.ts';
import { performOCR } from '../../src/features/ocr/perform-ocr.ts';
import { OCRModel, type IOCRModel } from '../../src/features/ocr/ocr-model.ts';
import { basename, dirname } from 'node:path/posix';
import { Query } from '@roenlie/sqlite-wrapper';
import { ocrDbPath, ocrTable } from '../../src/features/ocr/ocr-table.ts';
import { insertOCRDataToWeaviate } from '../../src/features/ocr/ocr-weaviate.ts';
import { mkdir, rename } from 'node:fs/promises';


export const parseUploads = async () => {
	const files = await globby(paths.tempUploads + '/**', {
		globstar:  true,
		onlyFiles: true,
	});

	const [ ocrResult, ocrErr ] = await performOCR('eng', files.map(f => f));
	if (ocrErr)
		return console.error(ocrErr);

	const ocrData = files.map((path, i) => {
		const file = basename(path);
		const dir = dirname(path).split('/').at(-1);

		return OCRModel.initialize({
			hash: dir!,
			name: file,
			text: ocrResult[i]!.data.text!,
		});
	});

	using query = new Query(ocrDbPath);
	query.transaction(query =>
		ocrData.forEach(data =>
			query.insert<IOCRModel>(ocrTable).values(data).query()));

	await insertOCRDataToWeaviate(ocrData
		.map(({ hash, text, name }) => ({ hash, text, name })));

	await Promise.all(files.map(async (file) => {
		const from = file;
		const to = file.replace(paths.tempUploads, paths.uploads);

		return mkdir(dirname(to), { recursive: true })
			.then(() => rename(from, to));
	}));
};
