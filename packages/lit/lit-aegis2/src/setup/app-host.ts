import type { RecursiveRecord, stringliteral } from '@roenlie/core/types';

import type { ScopeHierarchy } from '../app.types.ts';
import { pluginData } from '../data-structures.ts';
import type { ScopeId } from '../elements/types.ts';
import type { PluginBundle } from '../plugin/plugin-bundler.ts';
import type { ScopeOptions } from '../scope/scope-tree.ts';
import { scopeTree } from '../scope/scope-tree.ts';


const bundleConnector = {
	connect: (...bundles: PluginBundle[]) => {
		for (const bundle of bundles)
			bundle.connect(pluginData);
	},
};


export class CreatePluginScopeConnector<Scopes extends string, Modified = stringliteral> {

	constructor(protected optionsMap: Map<any, ScopeOptions>) { }

	public connect<Scope extends Scopes | stringliteral>(scope: Scope, options: ScopeOptions) {
		this.optionsMap.set(scope, options);

		return new CreatePluginScopeConnector<Exclude<Scopes, Scope>, Modified | Scope>(
			this.optionsMap,
		);
	}

	public disconnect<M extends Modified | stringliteral>(scope: M) {
		this.optionsMap.delete(scope);
	}

}


export class AppHost {

	private static bundles: (() => any)[] = [];

	public static defineScopes<
		T extends RecursiveRecord,
		TScopes extends ScopeHierarchy<T>
	>(hierarchy: T, cb: (connector: CreatePluginScopeConnector<TScopes>) => any) {
		const locationMapperMap = new Map<ScopeId, ScopeOptions>;

		cb(new CreatePluginScopeConnector(locationMapperMap));
		scopeTree.initialize(hierarchy, locationMapperMap);

		return this;
	}

	public static defineLayers(layers: RecursiveRecord) {
		pluginData.locationLayers = layers;

		return this;
	}

	public static registerBundles(cb: (connector: typeof bundleConnector) => any) {
		this.bundles.push(() => void cb(bundleConnector));

		return this;
	}

	public static addBundle(bundle: PluginBundle) {
		bundle.connect(pluginData);

		return this;
	}

	public static async connect(callbacks: {
		beforeBundleConnection?: () => Promise<void>,
		afterBundleConnection?:  () => Promise<void>,
		afterComponentLoad?:     () => Promise<void>
	}) {
		await callbacks.beforeBundleConnection?.();

		this.bundles.map(e => e());
		// After registering, we don't need to store a ref here anymore.
		this.bundles.length = 0;

		await callbacks.afterBundleConnection?.();
	}

}
