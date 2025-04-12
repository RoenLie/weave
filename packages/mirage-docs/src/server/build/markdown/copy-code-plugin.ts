import type { PluginSimple } from 'markdown-it';
import type { RenderRule } from 'markdown-it/lib/renderer.mjs';


const renderCode = (origRule?: RenderRule): RenderRule | undefined => {
	if (!origRule)
		return;

	return (...args) => {
		const [ tokens, idx ] = args;

		const origRendered = origRule(...args);
		let content = tokens[idx]?.content.trim();
		if (!content)
			return origRendered;

		// This makes it so that the generated component code handles the formatting.
		content = content
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('`', '\\`')
			.replaceAll('${', '\\${');

		return `
		<div class="copy-code-wrapper" style="position:relative;overflow:hidden;">
			${ origRendered }
			<midoc-copy-code>${ content }</midoc-copy-code>
		</div>
		`;
	};
};

export const copyCodePlugin: PluginSimple = (md) => {
	md.renderer.rules.code_block = renderCode(md.renderer.rules.code_block);
	md.renderer.rules.fence = renderCode(md.renderer.rules.fence);
};
