import { getWeaviateDb } from './get-weaviate-db.ts';


await using db = await getWeaviateDb();
const { client } = db;


async function similaritySearchNearText(concepts: string[]) {
	return await client
	  .collections
	  .get('JeopardyQuestion')
	  .query.nearText(concepts, {
			moveAway: { concepts: [ 'reptiles' ], force: 1 },
			limit:    2,
	  });
}

//async function similaritySearchNearObject(id: string) {
//	return await client
//	  .graphql
//	  .get()
//	  .withClassName('JeopardyQuestion')
//	  .withFields('question answer category _additional { distance id }')
//	  .withNearObject({ id: id })
//	  .withLimit(2)
//	  .do();
//}

//async function similaritySearchNearVector(vector: number[]) {
//	return await client
//	  .graphql
//	  .get()
//	  .withClassName('JeopardyQuestion')
//	  .withFields('question answer category _additional { distance id }')
//	  .withNearVector({ vector: vector })
//	  .withLimit(2)
//	  .do();
//}

async function runFullExample() {
	// comment this the line bellow if you don't want your class to be deleted each run.
	await deleteCollection();
	if (await collectionExists() == false) {
	  // lets create and import our collection
	  await createCollection();
	  await importData();
	}

	// Near Text example
	const concepts = [ 'question about animals' ];
	const near_text_response = await similaritySearchNearText(concepts);
	console.log('Near Text objects for:', concepts, JSON.stringify(near_text_response, null, 2));

	// Near Object example
	// lets store the id of our first match
	//const top_match_id = near_text_response.data['Get']['JeopardyQuestion'][0]['_additional']['id'];

	// lets search the two elements closests to our top object
	//const near_object_response = await similaritySearchNearObject(top_match_id);
	//console.log('Closest 2 objects to id:',
	//	top_match_id, JSON.stringify(near_object_response, null, 2));

	// now let's search the nearest objects close to a vector
	// first, let's grab a vector
	//const with_vector_query = await client
	//  .graphql
	//  .get()
	//  .withClassName('JeopardyQuestion')
	//  .withFields('_additional { vector id }')
	//  .withNearText({ 'concepts': [ 'big sized mammals' ] })
	//  .withLimit(2)
	//  .do();


	//const vector = with_vector_query.data['Get']['JeopardyQuestion'][0]['_additional']['vector'];
	//const id = with_vector_query.data['Get']['JeopardyQuestion'][0]['_additional']['id'];
	//console.log('This is our vector (truncated)', vector.slice(0, 10), '...');
	//console.log('It has this ID:', id);

	// now let's search for it
	//const near_vector_response = await similaritySearchNearVector(vector);
	//console.log('The two closest objects from this vector: ',
	//	JSON.stringify(near_vector_response, null, 2));
}

//runFullExample();


// Helper function to check if collection exists
async function collectionExists() {
	return client.collections.exists('JeopardyQuestion');
}


// Helper function to delete the collection
async function deleteCollection() {
	// Delete the collection if it already exists
	if (await collectionExists()) {
	  	console.log('DELETING');
		await client.collections.delete('JeopardyQuestion');
	}
}

// Create a new collection for your data and vectors
async function createCollection() {
	// Define collection configuration - vectorizer, generative module and data schema
	const schema_definition = {
	  class:        'JeopardyQuestion',
	  description:  'List of jeopardy questions',
	  vectorizer:   'text2vec-huggingface',
	  moduleConfig: { // specify the vectorizer and model type you're using
		 'text2vec-huggingface': {
				'model':   'sentence-transformers/all-MiniLM-L6-v2',
				'options': {
					'waitForModel': 'true',
					'useGPU':       'true',
					'useCache':     'true',
				},
		 },
	  },
	  properties: [
		 {
				name:        'Category',
				dataType:    [ 'text' ],
				description: 'Category of the question',
		 },
		 {
				name:        'Question',
				dataType:    [ 'text' ],
				description: 'The question',
		 },
		 {
				name:        'Answer',
				dataType:    [ 'text' ],
				description: 'The answer',
		 },
	  ],
	};

	// let's create it
	const new_class = await client.collections.createFromSchema(schema_definition);

	console.log('We have a new class!', new_class);
}

// import data into your collection
async function importData() {
	// now is time to import some data
	// first, let's grab our Jeopardy Questions from the interwebs

	// eslint-disable-next-line @stylistic/max-len
	const url = 'https://raw.githubusercontent.com/weaviate/weaviate-examples/main/jeopardy_small_dataset/jeopardy_tiny.json';
	const jeopardy_questions = await fetch(url).then(r => r.json());

	await client.collections
		.get('JeopardyQuestion')
		.data.insertMany(jeopardy_questions);

	console.log('Data Imported');
}
