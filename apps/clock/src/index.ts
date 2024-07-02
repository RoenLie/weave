import { ClockApp } from './app/app.cmp.js';
import { SERVER_URL } from './app/constants.js';
import { loadStyles } from './app/load-styles.js';

ClockApp.register();

loadStyles(
	SERVER_URL + '/serve/root-design/1.0.0/',
	[
		{ id: 'gate-style-index', href: 'tokens/index.css' },
		{ id: 'gate-style-tokens-all', href: 'tokens/tokens-all.css' },
		{ id: 'gate-style-tokens-extra', href: 'tokens/tokens-extra.css' },
		{ id: 'gate-style-tokens-font', href: 'tokens/tokens-font.css' },
		{ id: 'gate-style-tokens-dark', href: 'tokens/tokens-dark.css' },
		{ id: 'gate-style-tokens-light', href: 'tokens/tokens-light.css' },
	],
);
