import type { PluginOption } from 'vite';


export const litJsx = (): PluginOption => {
	return {
		name:    'lit-jsx-react-jsx',
		enforce: 'post',
		transform(code, id) {
			if (!id.endsWith('.tsx'))
				return;

			code = 'import { __ttl } from "jsx-lit";\n' + code;
			code = code.replaceAll('jsxDEV(', () => 'jsxDEV(__ttl``,');
			code = code.replaceAll('jsxs(',   () => 'jsxs(__ttl``,');
			code = code.replaceAll('jsx(',    () => 'jsx(__ttl``,');

			return code;
		},
	};
};
