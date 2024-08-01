import { pluginData } from '../data-structures.ts';
import type { ScopeId } from '../elements/types.ts';
import { scopeTree } from '../scope/scope-tree.ts';
import { registerPluginContainerContext } from './plugin-container.ts';
import { getScopedPluginLocations } from './plugin-load-order.ts';
import { loadPluginModules } from './plugin-modules.ts';


export class PluginLoader {

	protected get loadLocation() {
		return scopeTree.tree.getData(this.scope)?.loadLocation;
	}

	constructor(protected scope: ScopeId) {
		this.scope = scope;
	}

	/**
	 * Returns a dependency container that can be used for retrieving services.
	 */
	public async load() {
		await this.initialize();

		const scopeInfo = scopeTree.tree.getData(this.scope);
		const container = scopeInfo?.container;
		if (!container)
			throw new Error('Failed to load container for scope: ' + this.scope);

		return container;
	}

	/**
	 * Initializes the scope container, populating it with any relevant bindings.
	 */
	protected async initialize() {
		const scopeInfo = scopeTree.tree.getData(this.scope);
		if (!scopeInfo)
			throw new Error('Scope tree has not created a node for this scope: ' + this.scope);

		scopeTree.updateLoadLocation(this.scope);

		const { promise, resolve } = Promise.withResolvers<boolean>();
		scopeTree.loadingPromise(this.scope, promise);

		if (!pluginData.moduleLoadHistory.has(this.scope)) {
			pluginData.moduleLoadHistory.set(this.scope, promise);
		}
		else {
			await pluginData.moduleLoadHistory.get(this.scope);

			return resolve(true);
		}

		// Generates the cross product of locations that should be
		// searched for possible matching modules
		const locationIds = getScopedPluginLocations(this.scope);

		// Dynamically import all the container modules and await the results
		const pluginModules = await loadPluginModules(locationIds);

		// Load the imported container modules into the scope container
		scopeInfo.container.load(...pluginModules);

		registerPluginContainerContext(scopeInfo.container, this.loadLocation!);

		// Resolve the promise, allowing others to start using this container.
		scopeInfo.initialized = true;
		resolve(true);

		// Before continuing, make sure that all parent scopes are loaded.
		await this.initializeParentScope(this.scope);
	}

	/**
	 * Recursively initializes and awaits any parent scope that has not yet been initialized.
	 */
	protected async initializeParentScope(scopeId: ScopeId) {
		const parentRoot = scopeTree.tree.getNode(scopeId)?.parent;

		if (parentRoot?.data.initialized === false) {
			const loader = new PluginLoader(this.scope);
			await loader.load();
		}
	}

}
