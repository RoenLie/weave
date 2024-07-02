import type { RequestHandler } from 'express';
import { createModulesTable } from 'src/features/modules/modules-table.js';
import { createOTPtable } from 'src/features/otp/otp-table.js';
import { createUsersTable } from 'src/features/user/user-table.js';


export const get: RequestHandler[] = [
	(req, res) => {
		type ValidName = 'users' | 'OTP' | 'modules';
		const { name } = req.query as { name: ValidName; };

		if (name === 'users')
			createUsersTable();
		if (name === 'OTP')
			createOTPtable();
		if (name === 'modules')
			createModulesTable();

		res.sendStatus(200);
	},
];
