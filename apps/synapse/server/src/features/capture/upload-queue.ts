import { DataModel, Query } from '@roenlie/sqlite-wrapper';
import { ocrDbPath, ocrTable } from '../ocr/ocr-table.ts';


export interface IUploadQueueModel {
	queue_id: string;
	path:     string;
}


export class UploadQueueModel extends DataModel implements IUploadQueueModel {

	protected constructor(values: any) { super(values); }
	public static override parse = (values: UploadQueueModel) =>
		new this(values);

	public static override initialize = (values: Omit<UploadQueueModel, 'queue_id'>) =>
		new this(values);

	public queue_id: string;
	public path:     string;

}


export const uploadQueueTable = 'upload_queue';


export const createUploadQueueTable = () => {
	using query = new Query(ocrDbPath);

	query.define<IUploadQueueModel>(uploadQueueTable)
		.primaryKey('queue_id')
		.column('path', 'TEXT', { value: '', nullable: false })
		.query();
};
createUploadQueueTable();
