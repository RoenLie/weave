import { DataModel } from '@roenlie/sqlite-wrapper';


export interface IOCRModel {
	ocr_id: string;
	path:   string;
	text:   string;
}


export class OCRModel extends DataModel implements IOCRModel {

	public static override initialize = (values: Omit<OCRModel, 'ocr_id'>) => new this(values);
	public static override parse = (values: OCRModel) => new this(values);
	protected constructor(values: any) { super(values); }

	public ocr_id: string;
	public path:   string;
	public text:   string;

}
