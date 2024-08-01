import type { LocationResult } from '../app.types.ts';
import { $Container, $LoadLocation } from '../constants.ts';
import { objectsShallowEqual } from '../scope/utilities.ts';
import { transformLocationResult } from '../utilities/transform-location.ts';
import { PluginContainer } from './plugin.ts';
import { getPluginLocations } from './plugin-load-order.ts';
import { loadPluginModules } from './plugin-modules.ts';


/**
 * Register the `loadLocation` and the `container` with the `container`.
 */
export const registerPluginContainerContext = <TLocation extends object = Record<string, string>>(
	container: PluginContainer, loadLocation: TLocation,
) => {
	// Register the container itself as a resolvable binding.
	if (!container.isCurrentBound($Container))
		container.bind($Container).toConstantValue(container);

	// Register the load location in the container
	if (!container.isCurrentBound($LoadLocation)) {
		container.bind($LoadLocation).toConstantValue(loadLocation);
	}
	else if (!objectsShallowEqual(container.get($LoadLocation), loadLocation)) {
		container.unbind($LoadLocation);
		container.bind($LoadLocation).toConstantValue(loadLocation);
	}
};


/**
 * Create a `PluginContainer` loaded with the `PluginModules` matching the `directions` in the form of a `LocationResult`.
 */
export const createPluginContainer = async (directions: LocationResult) => {
	const container    = new PluginContainer();
	const locationIds  = getPluginLocations(directions);
	const loadLocation = transformLocationResult(directions);

	const pluginModules = await loadPluginModules(locationIds);

	container.load(...pluginModules);

	registerPluginContainerContext(container, loadLocation!);

	return container;
};
