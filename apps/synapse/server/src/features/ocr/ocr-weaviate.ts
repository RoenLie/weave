import type { DataObject, WeaviateReturn } from 'weaviate-client';
import { createCollection, moduleConfigs, type WeaviateClass } from '../vectordb/create-collection.ts';
import { getWeaviateDb } from '../vectordb/get-weaviate-db.ts';
import { maybe } from '@roenlie/core/async';


export const ocrDataSchema: WeaviateClass = {
	class:        'Ocr_data',
	description:  'OCR document data',
	vectorizer:   'text2vec-huggingface',
	moduleConfig: moduleConfigs['text2vec-huggingface'],
	properties:   [
		{
			name:         'name',
			dataType:     [ 'text' ],
			description:  'name of the document.',
			moduleConfig: {
				'text2vec-huggingface': {
					skip: true,
				},
			},
		},
		{
			name:        'text',
			dataType:    [ 'text' ],
			description: 'Text extracted from document.',
		},
		{
			name:         'hash',
			dataType:     [ 'text' ],
			description:  'hash refering to the documents physical location.',
			moduleConfig: {
				'text2vec-huggingface': {
					skip: true,
				},
			},
		},
	],
};


(async () => {
	await using db = await getWeaviateDb();
	await createCollection(db.client, ocrDataSchema);
})();


export interface OCRWeaviateProps {
	text: string;
	hash: string;
	name: string;
};


export const insertOCRDataToWeaviate = async (data: OCRWeaviateProps | OCRWeaviateProps[]) => {
	if (!Array.isArray(data))
		data = [ data ];

	const dataObj: DataObject<OCRWeaviateProps>[] = data
		.map(properties => ({ properties	}));

	await using db = await getWeaviateDb();

	return await maybe(
		db.client.collections
			.get(ocrDataSchema.class)
			.data.insertMany(dataObj),
	);
};


export const searchOCRData = async (text: string) => {
	await using weaviate = await getWeaviateDb();

	return await weaviate.client.collections
		.get(ocrDataSchema.class)
		.query.nearText(text, {
			limit:          10,
			distance:       0.6,
			returnMetadata: [ 'distance' ],
		}) as WeaviateReturn<OCRWeaviateProps>;
};
