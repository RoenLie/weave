import Original from 'better-sqlite3';
import { join, resolve } from 'path';


export class SQLite extends Original {

	constructor(filename?: string, options?: Original.Options) {
		super(filename ?? join(resolve(), 'database'), options);
		this.pragma('journal_mode = WAL');
	}

	public [Symbol.dispose]() {
		this.close();
	}

}
