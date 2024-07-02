export interface User {
	id: string;
	username: string;
	email: string;
	firstname: string;
	middlename: string;
	lastname: string;
	title: string;
	shift: string;
	department: string;
	company: string;
}

export interface NewUser extends Omit<User, 'id'> {}

export const newUserEntity = (): NewUser => {
	return {
		firstname:  '',
		middlename: '',
		lastname:   '',
		department: '',
		company:    '',
		username:   '',
		email:      '',
		title:      '',
		shift:      '',
	};
};
