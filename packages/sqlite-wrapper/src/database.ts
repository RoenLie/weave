import Original from 'better-sqlite3';


export class SQLite extends Original {

	constructor(filename?: string, options?: Original.Options) {
		super(filename, options);
		this.pragma('journal_mode = WAL');
	}

	public [Symbol.dispose]() {
		this.close();
	}

}
