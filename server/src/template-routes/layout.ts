import { app } from '../app.js';
import { css, html } from '../utilities/template-tag.js';


export const layout = app.get('/layout', (req, res) => {
	res.send([
		html`
		<aside>
			<w-button content-emit="route:/home">Home</w-button>
			<w-button content-emit="route:/settings">Settings</w-button>
		</aside>

		<section>
			<w-div connect="/home" content-listen="route"></w-div>
		</section>
		`,
		css`
		:host {
			display: grid;
			grid-template-columns: 90px 1fr;
			grid-template-rows: 1fr;
		}
		aside {
			background-color: goldenrod;
		}
		section {
			background-color: crimson;
		}
		`,
	]);
});


export const home = app.get('/home', (req, res) => {
	res.send([
		html`
		HOME
		`,
		css``,
	]);
});


export const settings = app.get('/settings', (req, res) => {
	res.send([
		html`
		SETTINGS
		`,
		css``,
	]);
});
