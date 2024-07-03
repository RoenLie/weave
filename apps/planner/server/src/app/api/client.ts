import { Container, CosmosClient } from '@azure/cosmos';
import { createPromiseResolver } from '@roenlie/core/async';

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;


export const client = new CosmosClient({ endpoint, key });


export class CosmosApi {

	protected ready = Promise.resolve(false);
	protected container: Container;

	constructor(
		protected databaseId: string,
		protected containerId: string,
		protected collectionId: string,
	) {
		const [ promise, resolve ] = createPromiseResolver<boolean>();
		this.ready = promise;

		(async () => {
			const { database } = await client.databases.createIfNotExists({ id: databaseId });
			const { container } = await database.containers.createIfNotExists({ id: containerId });
			this.container = container;
			resolve();
		})();
	}

	protected addDbIdentifier = <T extends Record<string, any>>(obj: T) => {
		return {
			...obj,
			_database:   this.databaseId,
			_container:  this.containerId,
			_collection: this.collectionId,
		} as T;
	};

}
