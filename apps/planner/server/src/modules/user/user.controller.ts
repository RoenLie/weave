import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import type { NewUser, User } from '@rotul/planner-entities';

import { generateFakeUsers } from './user.fake.js';
import { UserService } from './user.service.js';


@Controller('user')
export class UserController {

	constructor(private readonly userService: UserService) {}

	@Get('/:id')
	public async getById(@Param('id') id: string) {
		const [ data ] = await this.userService.get(id);

		return data;
	}

	@Put()
	public async updateById(@Body() user: User) {
		const [ data ] = await this.userService.update(user);

		return data;
	}

	@Post()
	public async create(@Body() user: NewUser) {
		const [ data ] = await this.userService.create(user);

		return data;
	}

	@Delete('/:id')
	public async deleteById(@Param('id') id: string) {
		const [ data ] = await this.userService.delete(id);

		return data;
	}

}


@Controller('users')
export class UsersController {

	constructor(private readonly userService: UserService) {}

	@Get()
	public async getUsers() {
		const [ data ] = await this.userService.getMany();

		return data;
	}

	@Get('generate')
	public async generateFakeData(@Query('amount') amount: string) {
		const [ data ] = await this.userService.createMany(generateFakeUsers(Number(amount)));

		return data;
	}

}
