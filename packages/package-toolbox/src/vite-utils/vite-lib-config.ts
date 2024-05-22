import { deepmerge } from 'deepmerge-ts';
import { globby } from 'globby';
import { type ConfigEnv, type UserConfig } from 'vite';


export type ConfigOverrides = UserConfig
| ((env: ConfigEnv) => UserConfig)
| ((env: ConfigEnv) => Promise<UserConfig>)


export interface ConfigOptions {
	entry?: {
		patterns: string[];
	},
	externalImport?: {
		/**
  		 *  Return `true or false` to override default externalize logic for this path.
  		 *  Return `undefined` to use default externalize logic for this path.
  		 */
		filter?: (
			source: string,
			importer: string | undefined,
			isResolved: boolean
		) => boolean | undefined;
		/** Expression used as externalize condition if filter returns undefined. */
		expression?: RegExp;
	};
}


export const libConfig = (
	customConfig?: ConfigOverrides,
	options?: ConfigOptions,
) => {
	return async (env: ConfigEnv) => {
		const {
			filter,
			expression = /^(?!\w+:[/\\])@?[\w]+[\w\-/.:]+$/,
		} = options?.externalImport ?? {};

		const entryPatterns = options?.entry?.patterns
			?? [ './src/**/!(*.(test|demo|types)).ts' ];

		const cfg: UserConfig = {
			/** Do not include the public directory in the package output. */
			publicDir: false,

			esbuild: {
				tsconfigRaw: {
					compilerOptions: {
						experimentalDecorators: true,
					},
				},
			},

			build: {
				outDir: 'dist',

				/** Don't empty the out dir, as we create our types first. */
				emptyOutDir: false,

				sourcemap: true,

				/** Indicates that this is a library build.
				 * Removes the requirement of a index.html file,
				 * instead starts at the entrypoint given in the options.
				 */
				lib: {
					/** We add all files as entrypoints */
					entry:   (await globby(entryPatterns)),
					formats: [ 'es' ],
				},

				rollupOptions: {
					/** By default, we externalize all dependencies.
					 *  a filter can be supplied that excludes certain sources from being externalized */
					external(source, importer, isResolved) {
						const filterResult = filter?.(source, importer, isResolved);
						if (filterResult !== undefined)
							return filterResult;

						// Returns true for any import using the standard external package syntax.
						// Returns false for any absolute or relative path.
						return expression.test(source);
					},

					output: {
						/** By preseving modules, we retain the folder structure of the original source, thereby allowing
						 *  generated d.ts files to be correctly picked up. */
						preserveModules: true,

						/** We remove src from any module paths to preserve the folder structure incase any virtual or node_modules
						 *  files are included */
						preserveModulesRoot: 'src',
					},
				},
			},
		};

		let customCfg: UserConfig | undefined = undefined;

		if (typeof customConfig === 'function')
			customCfg = await customConfig(env);
		else if (customConfig)
			customCfg = customConfig;

		return customCfg ? deepmerge(cfg, customCfg) : cfg;
	};
};
