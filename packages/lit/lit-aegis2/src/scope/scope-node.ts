import type { LocationMapper } from '../app.types.ts';
import type { ScopeComponent } from '../elements/scope-component.ts';
import type { ScopeId, ScopeType } from '../elements/types.ts';
import { PluginContainer } from '../plugin/plugin.ts';
import { rootContainer } from '../plugin/root-container.ts';
import { transformLocation } from '../utilities/transform-location.ts';
import { disposeContainer } from './utilities.ts';


export class ScopeInfo {

	public scopeType:      ScopeType;
	public scope:          ScopeId;
	public loadLocation:   Record<string, string>;
	public locationMapper: LocationMapper;
	public elements = new ObservableSet<ScopeComponent>();
	public elementHistory = new WeakSet<ScopeComponent>();
	public loadingSet = new Set<Promise<any>>();
	public autoDispose = true;
	public initialized = false;
	public stale = false;
	public container = new PluginContainer({
		defaultScope:        'Singleton',
		skipBaseClassChecks: true,
	});

	constructor(args: {
		scopeType:        ScopeType;
		scope:            ScopeId;
		locationMapper:   LocationMapper;
		autoDispose?:     boolean;
		parentContainer?: PluginContainer;
	}) {
		this.locationMapper = args.locationMapper;
		this.scopeType = args.scopeType;
		this.scope = args.scope;
		this.autoDispose = args.autoDispose ?? true;

		/* Assign the loading location from the supplied location mapper. */
		this.loadLocation = transformLocation(args.locationMapper);

		/* Adds the scope id to the container, for debugging purposes. */
		this.container.scopeId = args.scope;

		/* If a parent container is supplied, connect that parent. */
		if (args.parentContainer)
			this.container.parent = args.parentContainer;
		else
			this.container.parent = rootContainer;
	}

	/**
	 * Resets the container and history of elements that have connected.
	 */
	public reset() {
		disposeContainer(this.container, this.scope);
		this.elementHistory = new WeakSet();
	}

	/**
	 * Resets the node and
	 * also removes any element listeners and elements.
	 */
	public dispose() {
		this.reset();
		this.elements.disconnect();
		this.elements.clear();
	}

}
