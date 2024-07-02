import type { Optional } from './optional.js';


export interface IUser {
	user_id: number;
	username: string;
	name: string;
	email: string;
	password: string;
	role: 'Guest' | 'User' | 'Admin';
}


export class User implements IUser {

	public user_id: number;
	public username: string;
	public name: string;
	public email: string;
	public password: string;
	public role: 'Guest' | 'User' | 'Admin';

	private constructor(values: Optional<IUser, 'user_id'>) {
		if (values.user_id !== undefined)
			this.user_id = values.user_id;

		this.username = values.username;
		this.name = values.name;
		this.email = values.email;
		this.password = values.password;
		this.role = values.role;
	}

	public static parse(values: IUser) {
		return new User(values);
	}

	public static initialize(values: Omit<IUser, 'user_id'>) {
		return new User(values);
	}

}
