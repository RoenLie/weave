import weaviate from 'weaviate-client';


const huggingFaceApiKey = process.env['HUGGING_FACE_API_KEY'];
if (!huggingFaceApiKey)
	throw new Error('Missing Api key from .env');


export const getWeaviateDb = async () => {
	const client = await weaviate.connectToLocal({
		headers: {
			'X-huggingface-Api-Key': huggingFaceApiKey,
		},
	});

	return {
		client,
		[Symbol.asyncDispose]: async () => {
			await client.close();
		},
	};
};
