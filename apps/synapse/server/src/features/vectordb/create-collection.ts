import { type WeaviateClass as WClass } from '../../../node_modules/weaviate-client/dist/node/esm/openapi/types';
import type { WeaviateClient } from 'weaviate-client';


export type WeaviateClass = WClass & {
	class: Capitalize<NonNullable<WClass['class']>>
};


// Helper function to check if collection exists
export async function collectionExists(client: WeaviateClient, collection: string) {
	return await client.collections.exists(collection);
}


// Helper function to delete the collection
export async function deleteCollection(client: WeaviateClient, collection: string) {
	// Delete the collection if it already exists
	if (await collectionExists(client, collection))
		return await client.collections.delete(collection), true;

	return false;
}


export const createCollection = async (
	client: WeaviateClient,
	schema: WeaviateClass,
	/** If `true` deletes and recreates the collection */
	override = false,
) => {
	const exists = await collectionExists(client, schema.class);

	if (override && exists) {
		await client.collections.delete(schema.class);

		return await client.collections.createFromSchema(schema);
	}
	else if (!exists) {
		return await client.collections.createFromSchema(schema);
	}

	return client.collections.get(schema.class);
};


export const moduleConfigs = {
	'text2vec-huggingface': {
		'model':   'sentence-transformers/all-MiniLM-L6-v2',
		//'model':   'facebook/bart-large-cnn',
		//'model':   'deepset/roberta-base-squad2',
		'options': {
			'waitForModel': true,
			'useGPU':       true,
			'useCache':     true,
		},
	},
	'text2vec-contextionary': {
		'skip':                  true,
		'vectorizePropertyName': true,
	},
};
