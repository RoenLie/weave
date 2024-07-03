import { IndexDBSchema, IndexDBWrapper } from '@roenlie/core/indexdb';
import type { Image } from './components/gallery.cmp.ts';


export class CaptureSession extends IndexDBSchema<CaptureSession> {

	public static override dbIdentifier = 'sessions';
	public static override dbKey = 'id';

	public id = 'current';
	public hash:   string;
	public images: Image[];

}


IndexDBWrapper.setup('synapse', (setup) => {
	setup.createCollection(CaptureSession, 'sessions', { autoIncrement: true })
		.createIndex('id', 'id')
		.mutate(() => {});
});
