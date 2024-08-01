import type { ScopeId } from './elements/types.ts';
import type { LocationId, PluginEntry } from './plugin/plugin.types.ts';
import type { RecursiveRecord } from '@roenlie/core/types';

class PluginData {

	/** Holds the different location layers. */
	public locationLayers: RecursiveRecord = {};

	/** Caches all the registrered plugin modules. */
	public locationToPlugins = new Map<LocationId, PluginEntry[]>();

	/** Caches the complete resolution path of each location. */
	public locationResolutionPlan = new Map<LocationId, LocationId[]>();

	/** Cache that holds the relevant resolution path for a given location. */
	public actualResolutionPlan = new Map<LocationId, LocationId[]>();

	/** Map that has a set for each active location that has
  	  * information on which modules have been loaded. */
	public moduleLoadHistory = new Map<ScopeId, Promise<boolean>>();

}
export const pluginData = new PluginData();
export interface IPluginData extends PluginData {}


/** For debugging purposes in the browser console. */
(globalThis as any).LitAegis ??= {};
Object.assign((globalThis as any).LitAegis, {
	pluginData,
});
