export class IndexDBSchema<T> {

	static dbIdentifier: string;
	static dbKey:        string;

	constructor(init: {
		[P in keyof T as P extends keyof IndexDBSchema<T> ? never : P]: T[P]
	}) {
		for (const prop in init)
			(this as any)[prop] = init[prop as keyof typeof init];
	}

}


export class IndexDBWrapper {

	static #setups: Setup[] = [];

	static #handleRequestError(event: Event, reject: (reason?: any) => void) {
		const target = event.target as IDBOpenDBRequest;
		reject('Database error: ' + target.error);
	}

	static #handleRequestSuccess(event: Event, resolve: (value: any) => void) {
		const target = event.target as IDBOpenDBRequest;
		resolve(target.result);
	}

	static connect(dbName: string, version?: number): Database {
		const request = window.indexedDB.open(dbName, version);
		const promise: Promise<IDBDatabase> = new Promise((res, rej) => {
			request.onerror = ev => this.#handleRequestError(ev, rej);
			request.onsuccess = ev => this.#handleRequestSuccess(ev, res);
			request.onupgradeneeded = ev => {
				const target = ev.target as IDBOpenDBRequest | null;
				const db = target?.result;
				if (!db)
					return;

				const setupIndex = this.#setups.findIndex(s => s.dbName === dbName);
				if (setupIndex > -1) {
					const [ setup ] = this.#setups.splice(setupIndex, 1);
					setup?.__execute(db);
				}
			};
		});

		return new Database(promise);
	}

	static setup(dbName: string, fn: (setup: DBSetup) => void): void {
		if (this.#setups.find(s => s.dbName === dbName))
			throw new Error(`setup for ${ dbName } has already been registered.`);

		const setupInstance = new Setup(dbName);
		fn(setupInstance);

		this.#setups.push(setupInstance);
	}

}


interface SetupChain<T extends typeof IndexDBSchema<any>> {
	createIndex: (...args: Parameters<IDBObjectStore['createIndex']>) => SetupChain<T>;
	mutate:      (mutateFn: (collection: Collection<T>) => void) => void;
};


class Setup {

	#setups: ((db: IDBDatabase) => void)[] = [];

	constructor(public dbName: string) {}

	createCollection<T extends typeof IndexDBSchema<any>>(
		schema: T,
		...[ name, options ]: Parameters<IDBDatabase['createObjectStore']>
	): SetupChain<T> {
		const _createIndex: ((store: IDBObjectStore) => void)[] = [];

		const createIndex = (...args: Parameters<IDBObjectStore['createIndex']>) => {
			_createIndex.push((store: IDBObjectStore) => void store.createIndex(...args));

			return chain;
		};

		const mutate = (mutateFn: (collection: Collection<T>) => void) => {
			this.#setups.push((db: IDBDatabase) => {
				const store = db.createObjectStore(name, options);
				_createIndex.forEach(fn => fn(store));

				store.transaction.onerror = (event) => {
					const target = event.target as IDBOpenDBRequest;
					console.error('Database error: ' + target.error);
				};

				store.transaction.oncomplete = () => {
					const coll = new Database(Promise.resolve(db)).collection(schema);
					mutateFn(coll);
				};
			});
		};

		const chain: SetupChain<T> = { createIndex, mutate	};

		return chain;
	}

	__execute(db: IDBDatabase): void {
		this.#setups.forEach(setup => setup(db));
	}

}


class Database {

	constructor(public database: Promise<IDBDatabase>) {}

	collection<T extends typeof IndexDBSchema<any>>(schema: T) {
		return new Collection(
			schema,
			async (mode) => {
				const db = await this.database;
				const transaction = db.transaction(schema.dbIdentifier, mode);
				const store = transaction.objectStore(schema.dbIdentifier);

				return store;
			},
		);
	}

}


class Collection<T extends typeof IndexDBSchema<any>> {

	constructor(
		public schema: T,
		public collection: (mode: IDBTransactionMode) => Promise<IDBObjectStore>,
	) {}

	static #handleRequestError(event: Event, reject: (reason?: any) => void) {
		const target = event.target as IDBRequest;
		reject('Request error: ' + target.error);
	}

	static #handleRequestSuccess(event: Event, resolve: (value: any) => void) {
		const target = event.target as IDBRequest;
		resolve(target.result);
	}

	async get(
		query: IDBValidKey | IDBKeyRange,
	): Promise<InstanceType<T> | undefined> {
		const coll = await this.collection('readonly');

		const promise = await new Promise<T | undefined>((res, rej) => {
			const req = coll.get(query);

			req.onerror = event => Collection.#handleRequestError(event, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise !== undefined
			? new this.schema(promise) as InstanceType<T>
			: undefined as any;
	}

	async getByIndex(
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
			? new this.schema(promise) as InstanceType<T>
			: undefined as any;
	}

	async getAll() {
		const coll = await this.collection('readonly');
		const promise = await new Promise<T[]>((res, rej) => {
			const req = coll.getAll();

			req.onerror = ev => Collection.#handleRequestError(ev, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise.map(item => new this.schema(item) as InstanceType<T>);
	}

	async add<TKey extends IDBValidKey>(item: InstanceType<T>, key?: TKey): Promise<TKey> {
		const coll = await this.collection('readwrite');
		const promise = await new Promise<TKey>((res, rej) => {
			const req = coll.add(item, key ?? (item as any)[this.schema.dbKey]);

			req.onerror = ev => Collection.#handleRequestError(ev, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise;
	}

	async put<TKey extends IDBValidKey>(item: InstanceType<T>, key?: TKey): Promise<TKey> {
		const coll = await this.collection('readwrite');
		const promise = await new Promise<TKey>((res, rej) => {
			const req = coll.put(item, key ?? (item as any)[this.schema.dbKey]);

			req.onerror = ev => Collection.#handleRequestError(ev, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise;
	}

	async putByIndex<TKey extends IDBValidKey>(
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

	async delete<TKey extends IDBValidKey>(key: TKey): Promise<any> {
		const coll = await this.collection('readwrite');
		const promise = await new Promise((res, rej) => {
			const req = coll.delete(key);

			req.onerror = ev => Collection.#handleRequestError(ev, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise;
	}

	async deleteByIndex<TKey extends IDBValidKey>(
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
export type IndexDBSetup = typeof Setup;
export type IndexDBDatabase = typeof Database;
export type IndexDBCollection = typeof Collection;
