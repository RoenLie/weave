import allTokens from './tokens-all.css' with {type: 'css'};
import darkTokens from './tokens-dark.css' with {type: 'css'};
import extraTokens from './tokens-extra.css' with {type: 'css'};
import fontTokens from './tokens-font.css' with {type: 'css'};
import lightTokens from './tokens-light.css' with {type: 'css'};

let initialized = false;
export const initializeStyleTokens = () => {
	if (initialized)
		return;

	initialized = true;
	document.adoptedStyleSheets = [
		...document.adoptedStyleSheets,
		allTokens,
		extraTokens,
		fontTokens,
		darkTokens,
		lightTokens,
	];
};
initializeStyleTokens();
