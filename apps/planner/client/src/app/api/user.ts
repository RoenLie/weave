import { maybe } from '@roenlie/core/async';
import { NewUser, User } from '@rotul/planner-entities';

import { Interact } from '../../features/interact/interact.js';


export class UserApi {

	public static async get(id: string) {
		const promise = Interact.get<User>('/user/' + id);

		return maybe(promise);
	}

	public static async getMany() {
		const promise = Interact.get<User[]>('/users');

		return maybe<User[]>(promise);
	}

	public static async create(user: NewUser) {
		const promise = Interact.post<NewUser, User>('/user', {
			data: user,
		});

		return maybe(promise);
	}

	public static async update(user: Partial<User>) {
		const promise = Interact.put<Partial<User>, User>('/user', {
			data: user,
		});

		return maybe(promise);
	}

	public static async delete(id: string) {
		const promise = Interact.delete<boolean>('/user/' + id);

		return maybe(promise);
	}

}
