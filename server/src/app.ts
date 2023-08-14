import cors from 'cors';
import express, { type Express } from 'express';


export const app: Express = express().use(cors());
