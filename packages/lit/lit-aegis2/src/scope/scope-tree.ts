import type { LocationMapper } from '../app.types.ts';
import type { ScopeComponent } from '../elements/scope-component.ts';
import type { ScopeId } from '../elements/types.ts';
import { transformLocation } from '../utilities/transform-location.ts';
import type { TreeNode } from '../utilities/tree.ts';
import { traverse, Tree } from '../utilities/tree.ts';
import type { ElementNode } from './element-tree.ts';
import { elementTree } from './element-tree.ts';
import { ScopeInfo } from './scope-node.ts';
import { disposeScope, isLoadLocationStale } from './utilities.ts';
import type { RecursiveRecord } from '@roenlie/core/types';


export type ScopeNode = TreeNode<ScopeInfo>;


export interface ScopeOptions {
	locationMapper?: LocationMapper;
	autoDispose?:    boolean;
}


/**
 * Holds and creates the information needed for the scope hierarchy.
 */
export class ScopeTree {

	public tree = new Tree<ScopeInfo, ScopeInfo['scope']>(node => node.data.scope);

	public initialize(
		scopeHierarchy: RecursiveRecord,
		options: Map<ScopeId, ScopeOptions>,
	) {
		this.tree.clear();
		this.createFromRawObj(scopeHierarchy, options);
	}

	protected createFromRawObj(
		obj: RecursiveRecord,
		options: Map<ScopeId, ScopeOptions>,
		parentNode: ScopeNode | undefined = undefined,
	) {
		const parentData = parentNode?.data;

		for (let [ scope, childObj ] of Object.entries(obj)) {
			if (parentData?.scope)
				scope = parentData?.scope + '.' + scope;

			const {
				autoDispose,
				locationMapper = parentData?.locationMapper,
			} = options.get(scope) ?? {};

			if (!locationMapper)
				throw ('No location mapper found for scope: ' + scope);

			const treeRoot: ScopeNode = {
				parent: parentNode,
				data:   new ScopeInfo({
					scopeType:       'defined',
					scope,
					autoDispose,
					locationMapper,
					parentContainer: parentData?.container,
				}),
				children: [],
			};

			this.tree.add(treeRoot);

			this.createFromRawObj(childObj, options, treeRoot);

			treeRoot.data.elements.observe(
				(v, o, from) => !from.size && this.disposeNode(treeRoot),
			);
		}
	}

	public updateLoadLocation(scope: ScopeId) {
		const scopeInfo = this.tree.getData(scope);
		if (!scopeInfo)
			throw new Error('Invalid scope: ' + scope);

		scopeInfo.loadLocation = transformLocation(scopeInfo.locationMapper);
		scopeInfo.stale = false;
	}

	public previouslyConnected(scope: ScopeId, element: ScopeComponent) {
		const scopeInfo = this.tree.getData(scope);

		return !!scopeInfo?.elementHistory.has(element);
	}

	public addElement(scope: ScopeId, element: ScopeComponent) {
		const scopeInfo = this.tree.getData(scope);
		if (!scopeInfo)
			return console.error('Could not find scope node for scope: ' + scope);

		// We add the element to the history so that we can check if it has been connected before.
		scopeInfo.elementHistory.add(element);

		scopeInfo.elements.add(element);
		elementTree.add(element);
	}

	public removeElement(scope: ScopeId, element: ScopeComponent) {
		const scopeInfo = this.tree.getData(scope);
		if (!scopeInfo)
			return console.error('Could not find scope node for scope: ' + scope);

		scopeInfo.elements.delete(element);
		elementTree.remove(element);
	}

	/** Adds a promise to the loading set of a scope. */
	public loadingPromise(scope: ScopeId, promise: Promise<any>) {
		const scopeInfo = this.tree.getData(scope);
		if (!scopeInfo)
			return console.error('Could not find scope node for scope: ' + scope);

		scopeInfo.loadingSet.add(promise);
	}

	public async waitForCurrentScope(scope: ScopeId) {
		const scopeInfo = this.tree.getData(scope);
		if (!scopeInfo)
			throw new Error('Could not find scope: ' + scope);

		await waitForPromises(scopeInfo.loadingSet);
	}

	public async waitForParentScope(scope: ScopeId) {
		const node = this.tree.getNode(scope);
		const firstParent = node?.parent;
		if (!firstParent)
			return;

		let loadingParent = this.findFirstLoadingParent(firstParent.data.scope);
		while (loadingParent) {
			await waitForPromises(loadingParent.data.loadingSet);
			if (loadingParent.parent)
				loadingParent = this.findFirstLoadingParent(loadingParent.parent.data.scope);
			else
				loadingParent = undefined;
		}
	}

	protected findFirstLoadingParent(parentKey: ScopeId): ScopeNode | undefined {
		const node = this.tree.getNode(parentKey);
		if (node?.data.loadingSet.size)
			return node;
		if (node?.parent)
			return this.findFirstLoadingParent(node.parent.data.scope);
	}

	/**
	 * Reload the plugin scopes.
	 * This causes plugins loaded with a stale load location to be reinitialized.
	 */
	public async reloadScopes() {
		const staleRoots: TreeNode<ScopeInfo>[] = [];
		traverse(scopeTree.tree.roots, (node) => {
			if (isLoadLocationStale(node.data.scope))
				staleRoots.push(node);
		});

		const staleScopes = new Set(staleRoots.map(root => root.data.scope));

		// Disposes stale scopes.
		staleScopes.forEach(disposeScope);
		staleScopes.clear();

		const elements: ScopeComponent[] = staleRoots
			.flatMap(root => [ ...root.data.elements ]);

		const nodesToReconnect: ElementNode[] = [];

		/* Retrieve the top level nodes that will rerun its plugins connectedCallback. */
		traverse(elementTree.tree.roots, (node, _, exitBranch) => {
			if (elements.includes(node.data)) {
				nodesToReconnect.push(node);
				exitBranch();
			}
		});

		// Rerun the plugins connected callback.
		// This creates a new adapter, causing the keyed render to also recreate the template,
		// resulting in new scopes and nodes.
		for (const node of nodesToReconnect) {
			// We remove the top level element from the history of elements loaded by this scope.
			// This ensures that upon rerunning the connectedCallback, the element will also
			// rerun the pluginsConnected logic.
			const scope = scopeTree.tree.getData(node.data.scope);
			scope?.elementHistory.delete(node.data);

			// Manually run the disconnect and connect lifecycle methods.
			// this ensures any cleanup and setup code is rerun.
			node.data.disconnectedCallback();
			node.data.requestUpdate();
			node.data.connectedCallback();
		}
	}

	/** Adds a single scope node to the scope tree. */
	public addScopeNode(root: ScopeNode) {
		const { data } = root;

		const exists = !!this.tree.getData(data.scope);
		if (exists)
			throw new Error('Scope node already exists: ' + data.scope);

		this.tree.add(root);
		data.elements.observe(
			(v, o, from) => !from.size && this.disposeNode(root),
		);
	}

	/** Removes a single scope node from the scope tree. */
	protected removeScopeNode(root: ScopeNode) {
		const { data } = root;

		const exists = !!this.tree.getNode(data.scope);
		if (!exists)
			throw new Error('Scope node does not exist: ' + data.scope);

		this.tree.remove(root);
		data.dispose();
	}

	/**
	 * When the observed set no longer has any elements.
	 * Checks if child scopes can be disposed.
	 * If all child scopes can be disposed, starts disposing scopes upwards from itself
	 * until it reaches either an undisposable scope, or a scope flagged as `autoDispose=false`
	 */
	protected disposeNode(root: ScopeNode) {
		/*
		 Check if child all child scopes are empty of elements.
		 If encountering a scope with children, stop traversal.
		*/
		let hasChildren = false;
		traverse(root, (node, exit) => {
			if (node.data.elements.size) {
				hasChildren = true;
				exit();
			}
		});

		if (!hasChildren)
			this.disposeUpwards(root);
	}

	/**
	 * If all child scopes are empty. Empty self and move upwards.
	 * When moving upwards, check if parent is empty and flagged with `autoDispose`.
	 * If this is the case, empty the parent and continue upwards.
	 */
	protected disposeUpwards(root: ScopeNode) {
		const { data: { scopeType }, data: node, parent } = root;

		if (node.autoDispose && !node.elements.size) {
			if (scopeType === 'defined-transient' || scopeType === 'assigned-transient')
				this.removeScopeNode(root);
			else
				node.reset();
		}

		if (parent?.data.autoDispose)
			this.disposeUpwards(parent);
	}

}


export const scopeTree = new ScopeTree();


/** For debugging purposes in the browser console. */
(globalThis as any).LitAegis ??= {};
Object.assign((globalThis as any).LitAegis, {
	scopeTree,
});
