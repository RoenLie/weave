import type { PluginOption } from 'vite';

import type { CopyOptions } from './copy-files.js';
import { copy } from './copy-files.js';


interface ViteCopyOptions extends CopyOptions {
	/**
	 * Copy items once. Useful in watch mode.
	 * @default false
	 */
	readonly copyOnce?: boolean;

	/**
	 * Rollup hook the plugin should use.
	 * @default 'buildEnd'
	 */
	readonly hook?: 'config' | 'buildEnd' | (string & Record<never, never>);
}


export const viteCopy = (options: ViteCopyOptions = {}): PluginOption => {
	options = {
		copyOnce: false,
		hook:     'buildEnd',
		...options,
	};

	let copied = false;

	return {
		name:            'vite-plugin-copy',
		[options.hook!]: async () => {
			if (options.copyOnce && copied)
				return;

			copied = true;
			await copy(options);
		},
	} satisfies PluginOption;
};
