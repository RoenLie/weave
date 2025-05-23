import type { PluginWithOptions } from 'markdown-it';


export const anchorEnhancePlugin: PluginWithOptions<{ class: string; }> = (md) => {
	md.core.ruler.push('anchor_internalizer', (state) => {
		const tokens = state.tokens;

		for (const token of tokens) {
			if (token?.type !== 'inline')
				continue;

			for (const value of token.children ?? []) {
				if (value.type !== 'link_open')
					continue;

				const classes = (value.attrGet('class') ?? '')
					.split(' ')
					.filter(Boolean)
					.map(c => c.trim());

				if (!classes.some(s => s === 'internal'))
					classes.push('internal');

				value.attrSet('class', classes.join(' '));
			}
		}
	});
};
