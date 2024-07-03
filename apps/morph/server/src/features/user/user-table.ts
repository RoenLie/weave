import { faker } from '@faker-js/faker';
import { range } from '@roenlie/core/array';
import { type IUser, User } from '@roenlie/morph/models/user-model.js';

import { SQLite } from '../sqlite/database.js';
import { escapeString } from '../sqlite/escape-string.js';
import { Query } from '../sqlite/query.js';


export const createUsersTable = () => {
	using query = new Query();

	query.define<IUser>('users')
		.primaryKey('user_id')
		.column('username', 'TEXT', { value: '', nullable: false })
		.column('name',     'TEXT', { value: '', nullable: false })
		.column('email',    'TEXT', { value: '', nullable: false })
		.column('password', 'TEXT', { value: '', nullable: false })
		.column('role',     'TEXT', { value: '', nullable: false })
		.query();
};


export const createUsersDemoData = () => {
	using db = new SQLite();
	const roles: IUser['role'][] = [ 'User', 'Guest', 'Admin' ];

	using query = new Query();
	db.transaction(() => range(5).forEach(() => {
		const user = User.initialize({
			username: escapeString(faker.internet.userName()),
			name:     escapeString(faker.person.fullName()),
			email:    escapeString(faker.internet.email()),
			password: escapeString(faker.internet.password()),
			role:     roles[Math.floor(Math.random() * 3)]!,
		});

		query.insert<IUser>('users')
			.values(user)
			.query();
	}))();
};
