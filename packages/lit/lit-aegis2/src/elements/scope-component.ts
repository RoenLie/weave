import { property, state } from 'lit/decorators.js';

import type { PluginContainer, PluginModule } from '../plugin/plugin.ts';
import { PluginLoader } from '../plugin/plugin-loader.ts';
import { scopeTree } from '../scope/scope-tree.ts';
import { AppElement } from './app-element.ts';
import type { ScopeId, ScopeType } from './types.ts';


export class ScopeComponent extends AppElement {

	/** The type of scope that will be used for this component. */
	@property({ noAccessor: true, attribute: false }) public scopeType: ScopeType;

	/** The scope identifier that this component is connected to. */
	@property({ noAccessor: true, attribute: false }) public scope: ScopeId;

	/** When used with transient or dynamic-transient scope types, this is the parent scope. */
	@property({ noAccessor: true, attribute: false }) public originScope?: ScopeId;

	/** Gets registered container modules by pluginId. */
	@state() public plugins: PluginContainer;

	/** Modules declared directly on this component. */
	public pluginModules: PluginModule[] = [];

	/** Resolves after the pluginsConnectedCallback has been resolved. */
	public pluginsConnected: Promise<void> & { finished?: true; };

	protected get previouslyConnectedToCurrentScope() {
		return scopeTree.previouslyConnected(this.scope, this);
	}

	public override connectedCallback() {
		super.connectedCallback();

		const previouslyConnected = this.previouslyConnectedToCurrentScope;
		this.attachElementToScope();

		/*
		 Only perform container resolution and create a new adapter when it's the first
		 time component connects to this scope node.
		*/
		if (!previouslyConnected) {
			/*
			 Initiate the plugins connected callback.
			 We do not await this, as we don't want to block any other actions in overrides of the connectedCallback.
			 If an override of connectedCallback is async and requires plugins to be resolved.
			 Await the scopeConnected promise that is created and resolved in the pluginsConnectedCallback.
			*/
			(this.pluginsConnected = this.pluginsConnectedCallback())
				.then(() => this.pluginsConnected.finished = true);
		}
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();

		this.detachElementFromScope();
	}

	protected attachElementToScope() {
		scopeTree.addElement(this.scope, this);

		/* Set the scope as an attribute to make development easier. */
		this.setAttribute('scope', this.scope);
	}

	protected detachElementFromScope() {
		scopeTree.removeElement(this.scope, this);
	}

	/**
	 * This lifecycle method is called immediatly after connectedCallback.
	 * It is used for any setup code involving the plugin systems.
	 *
	 * await super.pluginsConnectedCallback() must be called before using the plugins
	 * property, as this ensures the loaders have been correctly initialized.
	 *
	 * @category lifecycle
	 */
	public async pluginsConnectedCallback(): Promise<void> {
		// Setup the promise that will be resolved when this components scope is fully resolved.
		const { promise, resolve } = Promise.withResolvers<void>();

		// Add the scope promise as a loading promise that will be awaited by any child scopes.
		scopeTree.loadingPromise(this.scope, promise);

		// Promise for the closest parent scope that has loading promises.
		await scopeTree.waitForParentScope(this.scope);

		// Promise for resolution of plugin and extension loaders.
		this.plugins = await new PluginLoader(this.scope).load();
		this.plugins.unload(...this.pluginModules);
		this.plugins.load(...this.pluginModules);

		// Resolve the loading promise to allow child scope and elements sharing same scope to continue.
		resolve();

		// Await any other promises that are for in progress for this scope.
		await scopeTree.waitForCurrentScope(this.scope);
	}

}
