import type { PluginSimple } from 'markdown-it';


const mermaidChart = (code: string) => {
	try {
		return `<div class="mermaid">${ code }</div>`;
	}
	catch (error) {
		return `<pre>${ error }</pre>`;
	}
};

export const MermaidPlugin: PluginSimple = (md) => {
	const temp = md.renderer.rules.fence!;
	md.renderer.rules.fence = function(tokens, idx, options, env, slf) {
		const token = tokens[idx]!;
		const code = token.content.trim();
		if (token.info === 'mermaid')
			return mermaidChart(code);

		const firstLine = code.split(/\n/)[0]!.trim();
		if (firstLine === 'gantt' || firstLine === 'sequenceDiagram' || firstLine.match(/^graph (?:TB|BT|RL|LR|TD);?$/))
			return mermaidChart(code);

		return temp.call(this, tokens, idx, options, env, slf);
	};
};