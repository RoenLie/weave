import { defineConfig } from 'vite';


export default defineConfig({
	base:   '/',
	server: {
		port:  6100,
		proxy: {
			'/handover': {
				target:       'http://localhost:6101/dev/handover',
				changeOrigin: true,
				ws:           true,
				rewrite:      (path) => path.replace(/^\/handover/, ''),
			},
			'/absence': {
				target:       'http://localhost:6102/dev/absence/',
				changeOrigin: true,
				ws:           true,
				rewrite:      (path) => path.replace(/^\/absence/, ''),
			},
		},
	},
});
