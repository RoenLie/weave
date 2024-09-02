import { SQLite } from '../app/database.ts';
import type { CodeModule } from '../api/code.controller.ts';
import { createCacheSlug, tsCache } from './transpile-ts.ts';


export const moduleImportToParts = (importPath: string) => {
	const parts     = importPath.split('/');
	const domain    = parts[0]!;
	const subdomain = parts[1]!;
	const path      = parts.slice(2).join('/');

	return {
		domain,
		subdomain,
		path,
	};
};


export const getModule = (domain: string, subdomain: string, path: string) => {
	using db = new SQLite();

	type In = [string, string, string];
	interface Out { data: string }

	const module = db.prepare<In, Out>(/* sql */`
	SELECT
		data
	FROM
		modules
	WHERE 1 = 1
		AND data ->> '$.tenant'    = 'core'
		AND data ->> '$.domain'    = (?)
		AND data ->> '$.subdomain' = (?)
		AND data ->> '$.path'      = (?)
	LIMIT
		1;
	`).get(domain, subdomain, path);

	if (!module)
		return;

	return JSON.parse(module.data) as CodeModule;
};


export const insertModule = (
	module: CodeModule,
) => {
	using db = new SQLite();

	db.prepare<[string]>(/* sql */`
	INSERT INTO modules (data) VALUES(json(?));
	`).run(JSON.stringify(module));
};


export const updateModule = (
	module: CodeModule,
) => {
	using db = new SQLite();

	module.updated_at = new Date().toISOString();

	type In = [string, string, string, string];
	interface Out { data: string }

	db.prepare<In, Out>(/* sql */`
	UPDATE
		modules
	SET
		data = json(?)
	WHERE 1 = 1
		AND data ->> '$.tenant'    = 'core'
		AND data ->> '$.domain'    = (?)
		AND data ->> '$.subdomain' = (?)
		AND data ->> '$.path'      = (?)
	LIMIT
		1;
	`).run(
		JSON.stringify(module),
		module.domain,
		module.subdomain,
		module.path,
	);

	const cacheSlug = createCacheSlug(module);
	tsCache.delete(cacheSlug);
};


export const deleteModule = (
	domain: string,
	subdomain: string,
	path: string,
) => {
	using db = new SQLite();

	db.prepare(/* sql */`
	DELETE FROM
		modules
	WHERE 1 = 1
		AND data ->> '$.tenant'    = 'core'
		AND data ->> '$.domain'    = (?)
		AND data ->> '$.subdomain' = (?)
		AND data ->> '$.path'      = (?)
	LIMIT
		1;
	`).run(domain, subdomain, path);

	const cacheSlug = createCacheSlug({ tenant: 'core', domain, subdomain, path });
	tsCache.delete(cacheSlug);
};


export const getAllModulesInSubdomain = (domain: string, subdomain: string) => {
	using db = new SQLite();
	const modules = db.prepare<[string, string], { data: string; }>(/* sql */`
		SELECT
			data
		FROM
			modules
		WHERE 1 = 1
			AND data ->> '$.tenant'    = 'core'
			AND data ->> '$.domain'    = (?)
			AND data ->> '$.subdomain' = (?);
		`).all(domain, subdomain)
		.map(r => JSON.parse(r.data) as CodeModule);

	return modules;
};


export const newModule = (
	domain: string,
	subdomain: string,
	path: string,
): CodeModule => {
	return {
		tenant:     'core',
		type:       'library',
		domain,
		subdomain,
		path,
		content:    '',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};
};
