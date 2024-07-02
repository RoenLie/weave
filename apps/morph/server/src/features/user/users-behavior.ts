import type { IUser, User } from '@roenlie/morph/models/user-model.js';

import { Query } from '../sqlite/query.js';


export const getAllUsers = () => {
	using query = new Query();
	const users = query.from<IUser>('users')
		.query();

	return users;
};

export const getUser = (values: {
	id?: string | number | bigint;
	username?: string;
	email?: string;
}) => {
	using query = new Query();
	const user = query.from<IUser>('users')
		.where(filter => filter.or(
			filter.and(
				filter.exists('user_id'),
				filter.eq('user_id', Number(values.id ?? '')),
			),
			filter.and(
				filter.exists('username'),
				filter.notOneOf('username', ''),
				filter.eq('username', values.username ?? ''),
			),
			filter.and(
				filter.exists('email'),
				filter.notOneOf('email', ''),
				filter.eq('email', values.email ?? ''),
			),
		))
		.limit(1)
		.query();

	return user[0];
};


export const userExists = (values: Parameters<typeof getUser>[0]) => {
	return !!getUser(values);
};


export const createUser = (user: User) => {
	using query = new Query();

	const results = query.insert('users')
		.values(user)
		.query();

	if (!results)
		return;

	const insertedUser = getUser({
		id: results.lastInsertRowid,
	});

	return insertedUser;
};
