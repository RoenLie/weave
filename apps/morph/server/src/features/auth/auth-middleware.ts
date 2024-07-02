import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';


declare global {
	namespace Express {
		interface Request {
			user: string | JwtPayload;
		}
	}
}


export const auth: RequestHandler = (req, res, next) => {
	try {
		//extract JWT token
		const token = req.body?.token || req.cookies?.token;
		if (!token) {
			if (req.url !== '/login')
				return res.redirect('/login');
			else
				return next();
		}

		//verify the token
		try {
			const decode = jwt.verify(token, process.env.JWT_SECRET);
			req.user = decode;
			console.log(req.user);
		}
		catch (error) {
			return res.status(401).json({
				success: false,
				message: 'invalid Token ⚠️',
			});
		}

		next();
	}
	catch (error) {
		return res.status(401).json({
			error,
			success: false,
			message: 'Error Occured in Authentication ⚠️',
		});
	}
};


export const isUser: RequestHandler = (req, res, next)=>{
	try {
		console.log(req.user);
		if ((req.user as any).role !== 'Student') {
			return res.status(401).json({
				success: false,
				message: 'You are not authorized Student ⚠️',
			});
		}

		next();
	}
	catch (error) {
		return res.status(500).json({
			success: false,
			message: 'Something error occured ⚠️: ' + error,
		});
	}
};

export const isAdmin: RequestHandler = (req, res, next)=>{
	try {
		if ((req.user as any).role !== 'Admin') {
			return res.status(401).json({
				success: false,
				message: 'You are not authorized Admin ⚠️',
			});
		}

		next();
	}
	catch (error) {
		return res.status(500).json({
			success: false,
			message: 'Something error occured ⚠️: ' + error,
		});
	}
};
