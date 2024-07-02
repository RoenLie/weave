import { defineConfig } from 'vite';


export default defineConfig(() => {
	return {
		base:   '/apps/clock/1.0.0/',
		define: {
			__APP_VERSION: JSON.stringify('1.0.0'),
			__APP_BASE:    JSON.stringify('/apps/clock/1.0.0/'),
		},
	};
});


declare global {
	// eslint-disable-next-line no-var
	var __APP_VERSION: string;
	// eslint-disable-next-line no-var
	var __APP_BASE: string;
}
