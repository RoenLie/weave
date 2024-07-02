import slugify from '@sindresorhus/slugify';
import hljs from 'highlight.js';
import mdIt from 'markdown-it';
import mdItAnchor from 'markdown-it-anchor';

import { anchorEnhancePlugin } from './anchor-enhance-plugin.js';
import { tabReplacePlugin } from './tab-replace-plugin.js';


export const markdownIt = mdIt({
	html:        true,
	linkify:     true,
	typographer: true,
	highlight:   (str: string, lang: string) => {
		if (lang && hljs.getLanguage(lang)) {
			try {
				return hljs.highlight(str, { language: lang }).value.replaceAll('`', '\\`');
			}
			catch (__) { /* Ignore errors! */ }
		}

		return ''; // use external default escaping
	},
}).use(mdItAnchor, {
	level:     1,
	slugify,
	permalink: mdItAnchor.permalink.headerLink(),
}).use(tabReplacePlugin, {
	tabWidth: 3,
}).use(anchorEnhancePlugin);
