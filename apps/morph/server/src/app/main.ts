import './env.js';

import { createServer } from 'node:http';

import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Express } from 'express';


dotenv.config({
	path: [
		'.env.dev',
		'.env.test',
		'.env.prod',
		'.env',
	],
});


export const app: Express = express()
	.use(cors())
	.use(express.json());


export const server = createServer(app);
