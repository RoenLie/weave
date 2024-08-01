import { adoptStyles, type CSSResultOrNative, nothing, type PropertyValues } from 'lit';
import { keyed } from 'lit/directives/keyed.js';

import type { Ctor, LocationMapper } from '../app.types.ts';
import type { Adapter } from '../plugin/adapter.ts';
import { ScopeInfo } from '../scope/scope-node.ts';
import { scopeTree } from '../scope/scope-tree.ts';
import { getBase } from '../utilities/get-base.ts';
import { ScopeComponent } from './scope-component.ts';
import type { AppComponentOptions, ScopeId, ScopeType } from './types.ts';
import { domId } from '@roenlie/core/dom';


export let currentAdapterElement: AppComponent | undefined;


export class AppComponent extends ScopeComponent {

	/** Options object, normally supplied from decorator. */
	public static options: AppComponentOptions<string>;

	/** Location mapper used for resolving the location of plugins. */
	public locationMapper?: LocationMapper;

	/**
 	 * Component adapter identifier, used to resolve the adapter from plugins.
	 * Defaults to the tagName.
	 */
	public adapterId: string | symbol | 'MISSING' = 'MISSING';

	/** The resolved component adapter. */
	public adapter: Adapter;

	protected createCustomScope(
		scopeType: ScopeType,
		scope: string,
		parentScope: string,
		locationMapper?: LocationMapper,
	): void {
		const parentNode = scopeTree.tree.getNode(parentScope);
		if (!parentNode)
			throw new Error('Could not get parent node from origin scope.');

		scopeTree.addScopeNode({
			parent:   parentNode,
			children: [],
			data:     new ScopeInfo({
				scopeType:       scopeType,
				scope:           scope,
				autoDispose:     true,
				parentContainer: parentNode?.data.container,
				locationMapper:  locationMapper ?? parentNode?.data.locationMapper,
			}),
		});
	}

	protected createScopeName(): string {
		const base = getBase<typeof AppComponent>(this);
		const { scopeType } = base.options;

		if (scopeType === 'defined')
			return base.options.scope;

		if (base.options.scopeType === 'assigned') {
			if (!this.scope)
				throw new Error('scope type: `dynamic` MUST have a scope set by consumer at connection.');

			return this.scope;
		}

		if (base.options.scopeType === 'assigned-transient') {
			if (!this.originScope)
				throw new Error('scope type: `assigned-transient` MUST have a originScope set by consumer at connection.');

			return this.originScope + '-' + domId(5);
		}

		if (base.options.scopeType === 'defined-transient')
			return base.options.originScope + '-' + domId(5);

		if (base.options.scopeType === 'inherit') {
			const closestScope = findFirstNode<ScopeComponent>(
				this, (el) => !!(el instanceof ScopeComponent && el.scope), true,
			)?.scope;

			if (!closestScope)
				throw new Error('scope type: `inherit` MUST have a scope above it in the dom hierarchy.');

			return closestScope;
		}

		throw new Error('Could not get scope name');
	}

	protected override attachElementToScope(): void {
		const base = getBase<typeof AppComponent>(this);

		this.scope ||= this.createScopeName();
		let performScopeInitialization = !this.previouslyConnectedToCurrentScope;

		// A transient scope might have been thrown out during context reload.
		// Therefor we need to check if the scope still exists, and allow for recreation if it does not.
		if ([ 'defined-transient', 'assigned-transient', 'inherit' ].includes(base.options.scopeType)) {
			if (!scopeTree.tree.getNode(this.scope))
				performScopeInitialization = true;
		}

		if (performScopeInitialization) {
			// We reset the scope name, as if its a transient it needs a new identifier.
			this.scope = this.createScopeName();

			// Reuse the old adapterId if it has already been set.
			// For the cases where the adapterId has been dynamically edited.
			this.adapterId = this.adapterId === 'MISSING'
				? base.options.adapterId ?? base.tagName
				: this.adapterId;

			this.scopeType ??= base.options.scopeType;

			if ([ 'assigned-transient', 'defined-transient' ].includes(base.options.scopeType)) {
				if ('originScope' in base.options)
					this.originScope = base.options.originScope;

				if ('locationMapper' in base.options)
					this.locationMapper ??= base.options.locationMapper;

				this.createCustomScope(
					base.options.scopeType,
					this.scope,
					this.originScope!,
					this.locationMapper,
				);
			}
		}

		super.attachElementToScope();
	}

	public override connectedCallback(): void {
		super.connectedCallback();

		// Let the plugins connect before running the adapter connected callback.
		// This ensures that any async loading of plugins is resolved before the adapter runs its connected lifecycle.
		this.pluginsConnected.then(() => this.adapter?.connectedCallback?.());
	}

	public override disconnectedCallback(): void {
		// Called before super to allow code to run prior to element being removed.
		this.adapter?.disconnectedCallback?.();

		super.disconnectedCallback();
		this.afterDisconnectedCallback();
	}

	public override async pluginsConnectedCallback(): Promise<void> {
		await super.pluginsConnectedCallback();

		const base = getBase<typeof AppComponent>(this);

		// Perform any adapter cleanup before reassigning a new adapter.
		// At this moment the adapter might be undefined.
		this.adapter?.dispose?.();

		// Retrieve the adapter constructor.
		let adapterCtor: typeof Adapter;

		if (this.plugins.isBound(this.adapterId)) {
			adapterCtor = this.plugins.get<typeof Adapter>(this.adapterId);
			if (!('prototype' in adapterCtor))
				throw new Error('Adapter bound to container must return the class, not an instance.');
		}
		else {
			if (!base.options.adapter)
				throw new Error('Component must have an assigned adapter if one is not bound to the container.');

			if (isFunction(base.options.adapter))
				base.options.adapter = base.options.adapter();

			adapterCtor = base.options.adapter as typeof Adapter;
		}

		// Binds current element to be picked up by adapter injector.
		currentAdapterElement = this as any;

		// Run the adapter constructor through the container to resolve any dependencies.
		this.adapter = this.plugins.resolve<Adapter>(adapterCtor);

		// Unbind current element so no other adapters get this element.
		currentAdapterElement = undefined;

		// We generate a new adapterKey, so that the render output will be forcefully flushed.
		this.adapterKey = domId();

		// Assign any styles from the adapter to the element.
		// Disregarding any styles from possible previous adapters.
		const adapterBase = getBase<typeof Adapter>(this.adapter);
		if (adapterBase.styles) {
			const styleSet = new Set<CSSResultOrNative>();

			base.elementStyles.forEach(s => styleSet.add(s));
			adapterBase.adapterStyles.forEach(s => styleSet.add(s));

			adoptStyles(this.shadowRoot!, [ ...styleSet ]);
		}
		else {
			adoptStyles(this.shadowRoot!, base.elementStyles);
		}
	}

	public override afterConnectedCallback(): void {
		this.adapter?.afterConnectedCallback?.();
	}

	public override afterDisconnectedCallback(): void {
		this.adapter?.afterDisconnectedCallback?.();
	}

	protected override firstUpdated(changedProps: PropertyValues): void {
		super.firstUpdated(changedProps);
		this.adapter.firstUpdated?.(changedProps);
	}

	protected override willUpdate(changedProps: PropertyValues): void {
		super.willUpdate(changedProps);
		this.adapter?.willUpdate?.(changedProps);
	}

	protected override update(changedProps: PropertyValues): void {
		super.update(changedProps);
		this.adapter?.update?.(changedProps);
	}

	protected override updated(changedProps: PropertyValues): void {
		super.updated(changedProps);
		this.adapter?.updated?.(changedProps);
	}

	protected override scheduleUpdate(): void | Promise<unknown> {
		// We wait for the plugins to be connected before running the update.
		// This ensures that any async loading of plugins is resolved before the adapter runs its rendering logic.
		if (!this.pluginsConnected.finished)
			return this.pluginsConnected.then(() => super.scheduleUpdate());

		super.scheduleUpdate();
	}

	protected adapterKey: string;
	protected override render(): unknown {
		// If at some point the component was disconnected, we do not render.
		if (!this.isConnected)
			return;

		return keyed(this.adapterKey, this.adapter.render?.() ?? nothing);
	}

}


export const appComponentDecorator = <TScope extends ScopeId>(
	options: AppComponentOptions<TScope>,
) => {
	return <TBase extends Ctor<typeof AppComponent>>(base: TBase): TBase => {
		base.tagName = options.tagname;
		base.options = options;

		return base;
	};
};
