import GUN from 'gun';
import 'gun/sea';
import 'gun/axe';
import { Publisher } from '@eyeshare/shared';

// Database
export const db = GUN();

// Gun User
export const user = db.user().recall({ sessionStorage: true });

// Current User's username
export const username = new Publisher('');

user.get('alias').on((v: any) => username.next(v));

db.on('auth', async (event) => {
	const alias = await user.get('alias'); // username string
	username.next(alias);

	console.log(`signed in as ${ alias }`);
});
