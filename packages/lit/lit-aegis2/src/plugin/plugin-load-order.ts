import type { LocationResult } from '../app.types.ts';
import { pluginData } from '../data-structures.ts';
import { type ScopeId } from '../elements/types.ts';
import { scopeTree } from '../scope/scope-tree.ts';
import { type LayerData, locationsToList } from '../utilities/layers-to-list.ts';


/**
 * Gets the cross product of the layers for plugins load order given a `scope`.
 */
export const getScopedPluginLocations = (scope: ScopeId) =>  {
	const locationMapper = scopeTree.tree.getData(scope)?.locationMapper;
	if (!locationMapper)
		throw new Error('Could not find a location mapper for scope: ' + scope);

	const directions = locationMapper();

	return getPluginLocations(directions);
};


/**
 * Gets the cross product of the layers for plugins load order
 * given `directions` in the form of a `LocationResult`.
 */
export const getPluginLocations = (directions: LocationResult) => {
	const location = directions.to.join('.');
	if (pluginData.actualResolutionPlan.has(location))
		return pluginData.actualResolutionPlan.get(location)!;

	const locations = pluginData.locationLayers;
	const lookupInput: LayerData[] = directions.from.map((from, i) =>
		({ node: locations[from]!, key: directions.to[i]! }));

	const resolutionSequence = locationsToList(lookupInput);
	pluginData.locationResolutionPlan.set(location, resolutionSequence);

	const filteredList = resolutionSequence
		.filter(c => pluginData.locationToPlugins.has(c));

	pluginData.actualResolutionPlan.set(location, filteredList);

	return filteredList;
};
