import slugify from '@sindresorhus/slugify';
import hljs from 'highlight.js';
import mdIt, { type PluginSimple, type PluginWithOptions } from 'markdown-it';
import mdItAnchor from 'markdown-it-anchor';

import type { InternalConfigProperties } from '../../config.js';
import { anchorEnhancePlugin } from './anchor-enhance-plugin.js';
import { copyCodePlugin } from './copy-code-plugin.js';
import { MermaidPlugin } from './mermaid-plugin.js';
import { tabReplacePlugin } from './tab-replace-plugin.js';


export interface MarkdownItConfig {
	plugins?: ({
		plugin:   PluginWithOptions<any> | PluginSimple;
		options?: any;
	})[];
	use?: {
		anchor?:        boolean;
		anchorEnhance?: boolean;
		tabReplace?:    boolean;
		mermaid?:       boolean;
		copyCode?:      boolean;
	};
};


export const markdownIt = {
	value: mdIt({
		html:        true,
		linkify:     true,
		typographer: true,
		highlight:   (str: string, lang: string) => {
			if (lang && hljs.getLanguage(lang)) {
				try {
					return hljs.highlight(str, { language: lang }).value
						.replaceAll('`', '\\`')
						.replaceAll('${', '\\${');
				}
				catch (__) { /* Ignore errors! */ }
			}

			return ''; // use external default escaping
		},
	}),
};


export const addDefaultMarkdownItPlugins = (use: MarkdownItConfig['use']): void => {
	if (use?.anchor ?? true) {
		markdownIt.value.use(mdItAnchor, {
			level:     1,
			slugify,
			permalink: mdItAnchor.permalink.headerLink(),
		});
	}
	if (use?.anchorEnhance ?? true)
		markdownIt.value.use(anchorEnhancePlugin);

	if (use?.mermaid ?? true)
		markdownIt.value.use(MermaidPlugin);

	if (use?.copyCode ?? true)
		markdownIt.value.use(copyCodePlugin);

	if (use?.tabReplace ?? true) {
		markdownIt.value.use(tabReplacePlugin, {
			tabWidth: 3,
		});
	}
};


export const addMarkdownItPlugins = (plugins: InternalConfigProperties['markdownit']['plugins'] = []): void => {
	for (const { plugin, options } of plugins)
		markdownIt.value.use(plugin, options);
};
