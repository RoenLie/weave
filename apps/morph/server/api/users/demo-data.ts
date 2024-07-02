import { createResponse } from '@roenlie/morph/server/utilities/create-response.js';
import type { RequestHandler } from 'express';
import { getAllUsers } from 'src/features/user/users-behavior.js';


export const get: RequestHandler[] = [
	async (req, res) => {
		const users = getAllUsers();

		res.send(createResponse(users, ''));
	},
];
