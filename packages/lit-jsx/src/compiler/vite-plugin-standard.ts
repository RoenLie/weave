import type { PluginOption } from 'vite';


export const litJsxStandard = (): PluginOption => {
	return {
		name:    'lit-jsx',
		enforce: 'post',
		transform(code, id) {
			if (!id.endsWith('.tsx'))
				return;

			code = 'import { __ttl } from "@roenlie/lit-jsx";\n' + code;
			code = code.replaceAll('jsxDEV(', () => 'jsxDEV(__ttl``,');
			code = code.replaceAll('jsxs(',   () => 'jsxs(__ttl``,');
			code = code.replaceAll('jsx(',    () => 'jsx(__ttl``,');

			return code;
		},
	};
};
