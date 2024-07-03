import { faker } from '@faker-js/faker';
import { range } from '@roenlie/core/array';
import { type IModule, Module } from '@roenlie/morph/models/modules-model.js';

import { SQLite } from '../sqlite/database.js';
import { escapeString } from '../sqlite/escape-string.js';
import { Query } from '../sqlite/query.js';


export const createModulesTable = () => {
	using query = new Query();

	query.define<IModule>('modules')
		.primaryKey('module_id')
		.column('code',        'TEXT',    { value: '',    nullable: false })
		.column('name',        'TEXT',    { value: '',    nullable: false })
		.column('description', 'TEXT',    { value: '',    nullable: false })
		.column('namespace',   'TEXT',    { value: '',    nullable: false })
		.column('active',      'INTEGER', { value: false, nullable: false })
		.query();
};


export const createModulesDemoData = () => {
	using db = new SQLite();

	const createCodeModule = (): IModule => {
		const module = Module.initialize({
			active:      1,
			namespace:   escapeString(faker.hacker.adjective()),
			name:        escapeString(faker.hacker.verb()),
			description: escapeString(faker.hacker.phrase()),
			code:        escapeString(faker.lorem.paragraph()),
		});

		return module;
	};

	using query = new Query();
	db.transaction(() => range(20).forEach(() => {
		const mod = createCodeModule();

		query.insert<IModule>('modules')
			.values(mod)
			.query();
	}))();
};
