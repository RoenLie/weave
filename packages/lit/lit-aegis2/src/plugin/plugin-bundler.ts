/* eslint-disable @stylistic/max-len */
import type { IPluginData } from '../data-structures.ts';
import type { PluginEntry } from './plugin.types.ts';


export class PluginBundler<T extends readonly string[]> {

	public bundle<P extends(...args: any[]) => T>(locationSetter: P[], ...pluginAssignments: PluginEntry[]): () => PluginBundle;
	public bundle<P extends(...args: any[]) => T>(locationSetter: P, ...pluginAssignments: PluginEntry[]): (...args: Parameters<P>) => PluginBundle;
	public bundle<P extends(...args: any[]) => T>(locationSetter: P | P[], ...pluginAssignments: PluginEntry[]) {
		const addToEntries = (entry: PluginEntry, data: IPluginData, setter: P, ...args: any[]) => {
			const loc = setter(...args).join('.');
			const entries = data.locationToPlugins.get(loc) ??
				data.locationToPlugins.set(loc, []).get(loc)!;

			entries.push(entry);
		};

		if (Array.isArray(locationSetter)) {
			return () => new PluginBundle(data => {
				for (const setter of locationSetter) {
					for (const entry of pluginAssignments)
						addToEntries(entry, data, setter);
				}
			});
		}

		return (...args: Parameters<P>) => new PluginBundle(data => {
			for (const entry of pluginAssignments)
				addToEntries(entry, data, locationSetter, ...args);
		});
	}

}


export class PluginBundle {

	constructor(public connect: (data: IPluginData) => void) {}

}
