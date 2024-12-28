interface Req { readonly __init: unique symbol }

/**
 * Marks a property as required during class construction.
 *
 * Will add this property to the required props in the constructor.
 */
export type Init<T> = T | Req;


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class MSchema {

	public static dbIdentifier: string;
	public static dbKey:        string;
	public static create<T extends object>(
		this: new () => T,
		init: Partial<T>,
	): T {
		const schema = new this() as T & Record<keyof any, any>;

		for (const prop in init) {
			const descriptor = Object.getOwnPropertyDescriptor(
				Object.getPrototypeOf(schema), prop,
			);

			// If there is a descriptor, it means the prop is an accessor.
			// And if there is no setter, we can't assign this property at this time.
			if (descriptor && !descriptor?.set && descriptor.value === undefined)
				continue;

			schema[prop] = init[prop]!;
		}

		return schema;
	}

}

export class MimicDB {

	static #setups: Setup[] = [];

	static #handleRequestError(event: Event, reject: (reason?: any) => void) {
		const target = event.target as IDBOpenDBRequest;
		reject(`Database error: ${ target.error }`);
	}

	static #handleRequestSuccess(event: Event, resolve: (value: any) => void) {
		const target = event.target as IDBOpenDBRequest;
		resolve(target.result);
	}

	public static connect(dbName: string, version?: number): Database {
		const request = indexedDB.open(dbName, version);
		const promise: Promise<IDBDatabase> = new Promise((res, rej) => {
			request.onerror = ev => this.#handleRequestError(ev, rej);
			request.onsuccess = ev => this.#handleRequestSuccess(ev, res);
			request.onupgradeneeded = ev => {
				const target = ev.target as IDBOpenDBRequest | null;
				const db = target?.result;
				if (db) {
					const setupIndex = this.#setups.findIndex(s => s.dbName === dbName);
					if (setupIndex > -1) {
						const [ setup ] = this.#setups.splice(setupIndex, 1);
						setup?.__execute(db);
					}
				}
			};
		});

		return new Database(promise);
	}

	public static setup(dbName: string, fn: (setup: DBSetup) => void) {
		if (this.#setups.find(s => s.dbName === dbName))
			throw new Error(`setup for ${ dbName } has already been registered.`);

		const setupInstance = new Setup(dbName);
		fn(setupInstance);

		this.#setups.push(setupInstance);
	}

}

class Setup {

	#setups: ((db: IDBDatabase) => void)[] = [];

	constructor(public dbName: string) {}

	public createCollection<T extends typeof MSchema>(
		schema: T,
		...[ name, options ]: Parameters<IDBDatabase['createObjectStore']>
	) {
		const _createCollection = (db: IDBDatabase) =>
			db.createObjectStore(name, options);
		const _createIndex: ((store: IDBObjectStore) => void)[] = [];

		const chain = {
			createIndex: (...args: Parameters<IDBObjectStore['createIndex']>) => {
				_createIndex.push(
					(store: IDBObjectStore) => void store.createIndex(...args),
				);

				return chain;
			},
			mutate: (mutateFn: (collection: Collection<T>) => void) => {
				this.#setups.push((db: IDBDatabase) => {
					const store = _createCollection(db);
					_createIndex.forEach(fn => fn(store));

					store.transaction.onerror = event => {
						const target = event.target as IDBOpenDBRequest;
						console.error(`Database error: ${ target.error }`);
					};

					store.transaction.oncomplete = () => {
						const coll = new Database(Promise.resolve(db)).collection(schema);
						mutateFn(coll);
					};
				});
			},
		};

		return chain;
	}

	public __execute(db: IDBDatabase) {
		this.#setups.forEach(setup => setup(db));
	}

}

class Database {

	constructor(public database: Promise<IDBDatabase>) {}

	public collection<T extends typeof MSchema>(schema: T) {
		return new Collection(schema, async mode => {
			const db = await this.database;
			const transaction = db.transaction(schema.dbIdentifier, mode);
			const store = transaction.objectStore(schema.dbIdentifier);

			return store;
		});
	}

}

class Collection<T extends typeof MSchema> {

	constructor(
		public schema: T,
		public collection: (mode: IDBTransactionMode) => Promise<IDBObjectStore>,
	) {}

	static #handleRequestError(event: Event, reject: (reason?: any) => void) {
		const target = event.target as IDBRequest;
		reject(`Request error: ${ target.error }`);
	}

	static #handleRequestSuccess(event: Event, resolve: (value: any) => void) {
		const target = event.target as IDBRequest;
		resolve(target.result);
	}

	public async get(query: IDBValidKey | IDBKeyRange) {
		const coll = await this.collection('readonly');

		const promise = await new Promise<T | undefined>((res, rej) => {
			const req = coll.get(query);

			req.onerror = event => Collection.#handleRequestError(event, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise !== undefined
			? this.schema.create(promise) as InstanceType<T>
			: undefined;
	}

	public async getByIndex(
		indexName: string,
		query: IDBValidKey | IDBKeyRange,
	): Promise<InstanceType<T> | undefined> {
		const coll = await this.collection('readonly');

		const promise = await new Promise<T | undefined>((res, rej) => {
			const req = coll.index(indexName).get(query);

			req.onerror = event => Collection.#handleRequestError(event, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise !== undefined
			? (this.schema.create(promise) as InstanceType<T>)
			: undefined;
	}

	public async getAll() {
		const coll = await this.collection('readonly');
		const promise = await new Promise<T[]>((res, rej) => {
			const req = coll.getAll();

			req.onerror = ev => Collection.#handleRequestError(ev, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise.map(item => this.schema.create(item) as InstanceType<T>);
	}

	public async add<TKey extends IDBValidKey>(
		item: InstanceType<T>,
		key?: TKey,
	): Promise<TKey> {
		const coll = await this.collection('readwrite');
		const promise = await new Promise<TKey>((res, rej) => {
			const _item: Record<keyof any, any> = {};
			for (const key in item)
				_item[key] = item[key];

			const req = coll.add(_item, key ?? (item as any)[this.schema.dbKey]);

			req.onerror = ev => Collection.#handleRequestError(ev, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise;
	}

	public async tryAdd<TKey extends IDBValidKey>(
		item: InstanceType<T>,
		key?: TKey,
	): Promise<TKey | undefined> {
		try {
			return await this.add(item, key);
		}
		catch (error) { /*  */ }
	}

	public async put<TKey extends IDBValidKey>(
		item: InstanceType<T>,
		key?: TKey,
	): Promise<TKey> {
		const coll = await this.collection('readwrite');
		const promise = await new Promise<TKey>((res, rej) => {
			const _item: Record<keyof any, any> = {};
			for (const key in item)
				_item[key] = item[key];

			const req = coll.put(_item, key ?? (item as any)[this.schema.dbKey]);

			req.onerror = ev => Collection.#handleRequestError(ev, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise;
	}

	public async putByIndex<TKey extends IDBValidKey>(
		indexName: string,
		query: IDBValidKey | IDBKeyRange,
		item: InstanceType<T>,
	): Promise<TKey> {
		const coll = await this.collection('readwrite');
		const collKey = await new Promise<TKey>((res, rej) => {
			const req = coll.index(indexName).getKey(query);

			req.onerror = ev => Collection.#handleRequestError(ev, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return await this.put(item, collKey);
	}

	public async delete<TKey extends IDBValidKey>(key: TKey): Promise<any> {
		const coll = await this.collection('readwrite');
		const promise = await new Promise((res, rej) => {
			const req = coll.delete(key);

			req.onerror = ev => Collection.#handleRequestError(ev, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise;
	}

	public async deleteByIndex<TKey extends IDBValidKey>(
		indexName: string,
		key: TKey,
	): Promise<any> {
		const coll = await this.collection('readwrite');
		const keyPromise = await new Promise<string>((res, rej) => {
			const req = coll.index(indexName).getKey(key);

			req.onerror = ev => Collection.#handleRequestError(ev, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		const promise = await new Promise((res, rej) => {
			const req = coll.delete(keyPromise);

			req.onerror = ev => Collection.#handleRequestError(ev, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise;
	}

}

export type DBSetup = Omit<Setup, '__execute' | 'dbName'>;
export type MimicDBSetup = typeof Setup;
export type MimicDBDatabase = typeof Database;
export type MimicDBCollection = typeof Collection;


export const enumerable = () => (
	target: any, propertyKey: string, descriptor: PropertyDescriptor,
) => {
	descriptor.enumerable = true;
};
