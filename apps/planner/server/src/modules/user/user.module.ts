import { Module } from '@nestjs/common';

import { UserController, UsersController } from './user.controller.js';
import { UserService } from './user.service.js';


@Module({
	imports:     [],
	controllers: [ UserController, UsersController ],
	providers:   [ UserService ],
})
export class UserModule {}
