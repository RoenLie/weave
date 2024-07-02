import { create, load, type Orama, type RawData, search } from '@orama/orama';


const defaultHtmlSchema = {
	type:    'string',
	content: 'string',
	path:    'string',
} as const;

// Creating a custom restore function because @orama/plugin-data-persistence
// exposes nodejs imports that don't work in the browser.
const customRestore = async (
	data: RawData,
): Promise<Orama<any, any, any, any>> => {
	const db = await create({
		schema: defaultHtmlSchema,
	});

	await load(db, data);

	return db;
};


(async () => {
	const JSONIndex = await fetch('../searchIndexes.json')
		.then(d => d.json()).then(d => d);

	const db = await customRestore(JSONIndex);

	self.onmessage = async (ev: MessageEvent) => {
		const searchParams = ev.data;
		const result = await search(db, searchParams);

		postMessage(result);
	};
})();
