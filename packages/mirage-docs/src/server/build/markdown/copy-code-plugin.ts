import type { PluginSimple } from 'markdown-it';
import type { RenderRule } from 'markdown-it/lib/renderer.mjs';


function renderCode(origRule?: RenderRule): RenderRule | undefined {
	if (!origRule)
		return;

	return (...args) => {
		const [ tokens, idx ] = args;

		const origRendered = origRule(...args);
		const content = tokens[idx]?.content;

		if ((content?.length ?? 0) === 0)
			return origRendered;

		return `
		<div style="position: relative">
			${ origRendered }
			<midoc-copy-code>${ content }</midoc-copy-code>
		</div>
		`;
	};
}

export const copyCodePlugin: PluginSimple = (md) => {
	md.renderer.rules.code_block = renderCode(md.renderer.rules.code_block);
	md.renderer.rules.fence = renderCode(md.renderer.rules.fence);
};
