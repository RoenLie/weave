import { Injectable } from '@nestjs/common';
import { maybe } from '@roenlie/core/async';

import { CosmosApi } from '../../app/api/client.js';


@Injectable()
export class BaseService<
	TEntity extends Record<keyof any, any>,
	TNewEntity extends Record<keyof any, any>,
> extends CosmosApi {

	constructor(collection: string) {
		super('planner', 'vault', collection);
	}

	public async get(id: string) {
		await this.ready;
		const promise = this.container.item(id).read();

		return maybe<TEntity>(promise.then(({ resource }) => resource));
	}

	public async getMany() {
		await this.ready;

		const promise = this.container.items
			.query({
				query: `SELECT * FROM vault v
				        WHERE v._collection=@collection`,
				parameters: [ { name: '@collection', value: this.collectionId } ],
			})
			.fetchAll();

		return maybe<TEntity[]>(promise.then(({ resources }) => resources));
	}

	public async create(entity: TNewEntity) {
		await this.ready;
		entity = this.addDbIdentifier(entity);

		const promise = this.container.items.create<TNewEntity>(entity);

		return maybe(promise.then(({ resource }) => resource as unknown as TEntity));
	}

	public async createMany(entities: TNewEntity[]) {
		await this.ready;

		const promises = entities.map(async submission => {
			submission = this.addDbIdentifier(submission);

			const { resource } = await this.container.items
				.create<TNewEntity>(submission);

			return resource as unknown as TEntity;
		});

		return maybe(Promise.all(promises));
	}

	public async update(entity: Partial<TEntity>) {
		await this.ready;
		const promise = this.container.items.upsert(entity);

		return maybe(promise.then(({ resource }) => resource as unknown as TEntity));
	}

	public async delete(id: string) {
		await this.ready;
		const promise = this.container.item(id).delete();

		return maybe(promise.then(() => true));
	}

	public async deleteAll() {
		await this.ready;

		const promise = this.container.items.query({
			query: `SELECT * FROM vault v
			        WHERE v._collection=@collection`,
			parameters: [ { name: '@collection', value: this.collectionId } ],
		}).fetchAll();

		const [ data ] = await maybe(promise.then(({ resources }) => resources));

		const deletePromise = Promise
			.all((data ?? []).map(({ id }) => this.container.item(id).delete()));

		return maybe(deletePromise.then(() => true));
	}

}
