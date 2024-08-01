import { pluginData } from '../data-structures.ts';
import { ScopeComponent } from '../elements/scope-component.ts';
import type { ScopeId } from '../elements/types.ts';
import type { PluginContainer } from '../plugin/plugin.ts';
import { transformLocation } from '../utilities/transform-location.ts';
import { scopeTree } from './scope-tree.ts';


/**
 * Reload the plugin scopes. This causes plugins loaded with a stale load location to be reinitialized.
 * You should call this whenever you make a change which can cause a locationMapper evaluation to change.
 *
 * Can supply a scopeId, which forces that spesific scope to be reloaded alongside any other stale scopes.
 */
export const reloadPluginScopes = (scope?: ScopeId) => {
	if (scope) {
		const scopeInfo = scopeTree.tree.getData(scope);
		if (scopeInfo)
			scopeInfo.stale = true;
	}

	scopeTree.reloadScopes();
};


export const findParentAppElementBase = (element: Node) => {
	return findFirstNode<ScopeComponent>(element,
		n => n instanceof ScopeComponent, true);
};


export const isLoadLocationStale = (scope: ScopeId) => {
	const scopeInfo = scopeTree.tree.getData(scope);
	if (!scopeInfo)
		throw new Error('Could not find a scope node for scope: ' + scope);

	if (scopeInfo.stale)
		return true;

	return !objectsShallowEqual(
		scopeInfo.loadLocation,
		transformLocation(scopeInfo.locationMapper),
	);
};


export const disposeScope = (scope: ScopeId) => {
	const scopeInfo = scopeTree.tree.getData(scope);
	const container = scopeInfo?.container;
	if (!container)
		return;

	disposeContainer(container, scope);
	scopeTree.updateLoadLocation(scope);
};


export const disposeContainer = (container: PluginContainer, scope: ScopeId) => {
	container.unbindAll();
	pluginData.moduleLoadHistory?.delete(scope);
};


export const objectsShallowEqual = (a: Record<string, any>, b: Record<string, any>) => {
	const aEntries = Object.entries(a);
	const bEntries = Object.entries(b);

	if (aEntries.length !== bEntries.length)
		return false;

	return aEntries.every(([ key, value ], i) => {
		const [ tKey, tValue ] = bEntries[i]!;

		return key === tKey && value === tValue;
	});
};
