import { ScopeComponent } from '../elements/scope-component.ts';
import { Tree, type TreeNode } from '../utilities/tree.ts';
import { findParentAppElementBase } from './utilities.ts';


export type ElementNode = TreeNode<ScopeComponent>;


/** Tracks an app element and its relation to a parent and child nodes. */
export class ElementTree {

	public tree = new Tree<ScopeComponent, ScopeComponent>(node => node.data);

	constructor(elements?: ScopeComponent[]) {
		elements?.forEach(element => this.add(element));

		// This is done twice, so that any nodes without parents
		// can have their parent and children correctly appended.
		this.tree.roots.forEach(root => this.add(root.data));
	}

	/** Add the `element` to the hierarchy. */
	public add(element: ScopeComponent) {
		let parentNode: TreeNode<ScopeComponent> | undefined;

		const parentElement = findParentAppElementBase(element);
		if (parentElement)
			parentNode = this.tree.getNode(parentElement);

		this.tree.add({
			parent:   parentNode,
			children: [],
			data:     element,
		});
	}

	/** Remove the `element` from the hierarchy. */
	public remove(element: ScopeComponent) {
		const node = this.tree.getNode(element);
		if (node)
			this.tree.remove(node);
	}

}


export const elementTree = new ElementTree();


/** For debugging purposes in the browser console. */
(globalThis as any).LitAegis ??= {};
Object.assign((globalThis as any).LitAegis, {
	elementTree,
});
