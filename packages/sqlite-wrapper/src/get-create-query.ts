import type SQLite from 'better-sqlite3';
import { sql } from './sql.ts';


export const getCreateQuery = (db: SQLite.Database, table: string) => {
	return (db.prepare(sql`
	SELECT sql FROM sqlite_master
	WHERE tbl_name = '${ table }' AND type = 'table'
	`).get() as { sql: string }).sql;
};

export const getTableColumns = (db: SQLite.Database, table: string) => {
	return db.prepare(sql`PRAGMA table_info(${ table });`).all() as {
		cid:        number;
		name:       string;
		type:       string;
		notnull:    0 | 1;
		dflt_value: null | string | number;
		pk:         0 | 1;
	}[];
};
