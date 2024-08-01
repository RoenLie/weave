import { pluginData } from '../data-structures.ts';
import type { LocationId, PluginEntry } from './plugin.types.ts';


/**
 * Load the `PluginModule`s which has content for the `locationIds`.
 */
export const loadPluginModules = async (locationIds: LocationId[]) => {
	const pluginArray: PluginEntry[] = [];
	for (const location of locationIds) {
		const entries = pluginData.locationToPlugins.get(location);
		if (entries) {
			for (const entry of entries)
				pluginArray.push(entry);
		}
	}

	// Dynamically import all the modules.
	return await Promise.all(pluginArray.map(exp => exp.module()));
};
