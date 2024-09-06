import { join } from 'node:path';
import { defineConfig } from 'vite';


export default defineConfig({
	root: join(process.cwd(), 'demo'),
});
