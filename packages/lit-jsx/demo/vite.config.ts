import { litJsx } from 'jsx-lit/vite-jsx-preserve';
import { defineConfig } from 'vite';


export default defineConfig({
	plugins: [ litJsx() ],
	build:   {
		minify:        false,
		rollupOptions: {
			preserveEntrySignatures: 'strict',
			output:                  {
				preserveModules:     true,
				preserveModulesRoot: 'src',
			},
		},
	},
});
