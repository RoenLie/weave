import type { DataObject } from 'weaviate-client';
import { createCollection, deleteCollection, moduleConfigs } from '../vectordb/create-collection.ts';
import { getWeaviateDb } from '../vectordb/get-weaviate-db.ts';


(async () => {
	await using db = await getWeaviateDb();
	await createCollection(db.client, {
		class:        'Ocr_data',
		description:  'OCR document data',
		vectorizer:   'text2vec-huggingface',
		moduleConfig: moduleConfigs['text2vec-huggingface'],
		properties:   [
			{
				  name:        'name',
				  dataType:    [ 'text' ],
				  description: 'name of the document.',
			},
			{
				  name:        'text',
				  dataType:    [ 'text' ],
				  description: 'Text extracted from document.',
			},
			{
				  name:        'hash',
				  dataType:    [ 'text' ],
				  description: 'hash refering to the documents physical location.',
			},
		 ],
	});

	await deleteCollection(db.client, 'JeopardyQuestion');
})();


interface OCRWeaviateProps {
	text: string;
	hash: string;
	name: string;
};


export const insertOCRDataToWeaviate = async (data: OCRWeaviateProps | OCRWeaviateProps[]) => {
	if (!Array.isArray(data))
		data = [ data ];

	const dataObj: DataObject<OCRWeaviateProps>[] = data
		.map(properties => ({ properties	}));

	console.log('inserting ocr data to weaviate');

	await using db = await getWeaviateDb();
	await db.client.collections
		.get('Ocr_data')
		.data.insertMany(dataObj);

	console.log('finished inserting ocr data to weaviate');
};
