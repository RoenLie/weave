import { DataModel } from '@roenlie/sqlite-wrapper';
import { createOcrTable } from './ocr-table.ts';

createOcrTable();


export interface IOCRModel {
	ocr_id: string;
	hash:   string;
	name:   string;
	text:   string;
}


export class OCRModel extends DataModel implements IOCRModel {

	public static override initialize = (values: Omit<OCRModel, 'ocr_id'>) => new this(values);
	public static override parse = (values: OCRModel) => new this(values);
	protected constructor(values: any) { super(values); }

	public ocr_id: string;
	public hash:   string;
	public name:   string;
	public text:   string;

}
