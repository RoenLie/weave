import type SQLite from 'better-sqlite3';

import { getCreateQuery } from './get-create-query.ts';
import { sql } from './sql.ts';


/** Drops a column from sqlite table. */
export const dropColumn = (db: SQLite.Database, table: string, column: string) => {
	const originalCreateQry = getCreateQuery(db, table);

	// We get the columns, trim and filter away
	// the any lines that use the column name that we want to remove.
	const lines = originalCreateQry.slice(
		originalCreateQry.indexOf('(') +  1,
		originalCreateQry.lastIndexOf(')'),
	).split(
		',',
	).map(
		str => str
			.replace(/^\t/, '')
			.replace(/^\n/, '')
			.replace(/\t$/, '')
			.replace(/\n$/, '')
			.trim(),
	).filter(str => !str.includes(column));

	// disable foreign key constraint check
	db.pragma('foreign_keys=off');

	db.transaction(() => {
		db.prepare(sql`
		-- Here you can drop column
		CREATE TABLE IF NOT EXISTS new_table(${ lines.join(',') });
		`).run();

		const newColumns = db.prepare(sql`PRAGMA table_info(new_table);`).all() as {
			cid:        number;
			name:       string;
			type:       string;
			notnull:    0 | 1;
			dflt_value: null | string | number;
			pk:         0 | 1;
		}[];

		const columnNames = newColumns.map(def => def.name).join(',');
		db.prepare(sql`
		-- copy data from the table to the new_table
		INSERT INTO new_table(${ columnNames })
		SELECT ${ columnNames }
		FROM ${ table };
		`).run();

		db.prepare(sql`
		-- drop the table
		DROP TABLE ${ table };
		`).run();

		db.prepare(sql`
		-- rename the new_table to the table
		ALTER TABLE new_table RENAME TO ${ table };
		`).run();
	})();

	// enable foreign key constraint check
	db.pragma('foreign_keys=on');
};
