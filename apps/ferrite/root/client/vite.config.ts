import { defineConfig, type ProxyOptions } from 'vite';


export default defineConfig((env) => {
	if (env.mode === 'development') {
		function rewrite(this: ProxyOptions, path: string) {
			const url = new URL(this.target as string);
			const regex = new RegExp('^' + url.pathname);

			return path.replace(regex, '');
		}

		return {
			base:   '/',
			server: {
				port:  6100,
				proxy: {
					'/handover': {
						target:       'http://localhost:6100/dev/handover',
						changeOrigin: true,
						ws:           true,
						rewrite,
					},
					'/dev/handover': {
						target:       'http://localhost:6101/dev/handover',
						changeOrigin: true,
						ws:           true,
						rewrite,
					},
					'/absence': {
						target:  'http://localhost:6100/dev/absence/',
						toProxy: true,
						rewrite,
					},
					'/dev/absence': {
						target:       'http://localhost:6102/dev/absence/',
						changeOrigin: true,
						ws:           true,
						rewrite,
					},
				},
			},
		};
	}

	return {
		base: '/',
	};
});
