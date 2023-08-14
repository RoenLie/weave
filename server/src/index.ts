import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Express } from 'express';

import { css, html } from './template-tag.js';

dotenv.config();

const app: Express = express();
app.use(cors());
const port = process.env['PORT'];


app.get('/root', (req, res) => {
	res.send([
		html`
		<div>
		<w-div connect="/navbar"></w-div>
		</div>
		`,
		css`
		:host {
			display: grid;
		}
		`,
	]);
});

app.get('/navbar', (req, res) => {
	res.send([
		html`
		<div class="wrapper">
			<a>Your mom</a>
		</div>
		`,
		css`
		:host {
		}
		.wrapper {
			display: flex;
			flex-flow: row nowrap;
		}
		`,
	]);
});


app.listen(port, () => {
	console.log(`⚡️[server]: Server is running at http://localhost:${ port }`);
});
