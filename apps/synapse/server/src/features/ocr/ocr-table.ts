import { Query } from '@roenlie/sqlite-wrapper';
import { paths } from '../../app/paths.ts';
import type { IOCRModel } from './ocr-model.ts';
import { join } from 'path/posix';


export const ocrDbPath = join(paths.databases, 'ocr');


export const ocrTable = 'ocr_data';


export const createOcrTable = () => {
	using query = new Query(ocrDbPath);

	query.define<IOCRModel>(ocrTable)
		.primaryKey('ocr_id')
		.column('hash', 'TEXT', { value: '', nullable: false })
		.column('name', 'TEXT', { value: '', nullable: false })
		.column('text', 'TEXT', { value: '', nullable: false })
		.query();
};
