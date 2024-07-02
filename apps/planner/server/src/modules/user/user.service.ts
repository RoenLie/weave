import { Injectable } from '@nestjs/common';
import { NewUser, User } from '@rotul/planner-entities';

import { BaseService } from '../app/base-service.js';


@Injectable()
export class UserService extends BaseService<User, NewUser> {

	constructor() {
		super('users');
	}

}
