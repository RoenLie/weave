import { componentAutoImporter } from '@roenlie/vite-plugin-ce-auto-import';
import { config } from 'dotenv';
import { defineConfig } from 'vite';


export default defineConfig(async () => {
	config();

	return {
		define: {
			__SERVER_URL: JSON.stringify(process.env['SERVER_ENDPOINT']),
		},

		plugins: [
			componentAutoImporter({
				directories:   [ { path: './src' } ],
				prefixes:      [ /pl-/ ],
				loadWhitelist: [ /\.ts/ ],
			}),
		],
	};
});
