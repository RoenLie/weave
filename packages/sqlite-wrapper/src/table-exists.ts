import { SQLite } from './database.js';


export const tableExists = (table: string) => {
	using db = new SQLite();

	const result = db.prepare(/* sql */`
	SELECT name
	FROM sqlite_master
	WHERE type='table' AND name='${ table }';
	`).get();

	return !!result;
};
