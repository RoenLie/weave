import { User } from '@roenlie/morph/models/user-model.js';
import { createUser, getUser } from '@roenlie/morph/server/features/user/users-behavior.js';
import type { RequestHandler } from 'express';
import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator';


export const get: RequestHandler[] = [
	async (req, res) => {
		const { username } = req.query as { username: string; };

		let user = getUser({ username, email: username });
		if (!user) {
			user = createUser(User.initialize({
				username,
				email:    username,
				name:     '',
				password: '',
				role:     'User',
			}));
		}

		if (!user)
			return res.sendStatus(500);

		const transporter = nodemailer.createTransport({
			host: process.env.MAIL_HOST,
			port: 587,
			auth: {
				user: process.env.MAIL_USER,
				pass: process.env.MAIL_PASS,
			},
		});

		const otp = otpGenerator.generate();

		const info = await transporter.sendMail({
			from:    '"Morph" <morph@ethereal.email>', // sender address
			to:      user.email,                       // list of receivers
			subject: 'One-time Password',              // Subject line
			text:    otp,                              // plain text body
			html:    `<b>${ otp }</b>`,                // html body
		});

		console.log(info);
	},
];
