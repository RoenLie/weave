import { htmlModules } from '@roenlie/vite-plugin-html-modules';
import { defineConfig } from 'vite';
import { viteImportCssSheet } from 'vite-plugin-import-css-sheet';


export default defineConfig({
	root:      './src',
	publicDir: '../public',
	build:     {
		outDir:        '../dist',
		minify:        false,
		rollupOptions: {
			input: [
				'./src/index.html',
				'./src/login.html',
			],

			preserveEntrySignatures: 'strict',
			output:                  {
				/** By preseving modules, we retain the folder structure of the original source, thereby allowing
				 *  generated d.ts files to be correctly picked up. */
				preserveModules: true,

				entryFileNames: ({ name }) => {
					// node_modules/.pnpm/@roenlie_lit-aegis@1.0.33_lit@3.1.1/node_modules/@roenlie/lit-aegis/dist/lib/container/container
					if (name.includes('node_modules/.pnpm/')) {
						const [ version, path ] = name
							.split('node_modules/.pnpm/')[1]!
							.split('/node_modules/');

						const newVersion = version!.split('@')
							.filter(Boolean)
							.slice(0, 2)
							.join('@')
							.replace(/\D+$/, '');

						const newPath = path!.startsWith('@')
							? path!.split('/').slice(2).join('/')
							: path!.split('/').slice(1).join('/');

						const newName = `${['node_modules', newVersion, newPath].join('/')}.js`;

						return newName;
					}

					return `${name}.js`;
				},

				/** We remove src from any module paths to preserve the folder
				 *  structure incase any virtual or node_modules files are included */
				preserveModulesRoot: 'src',
			},
		},
	},
	plugins: [ viteImportCssSheet(), htmlModules({ exportIds: true }) ],
});
