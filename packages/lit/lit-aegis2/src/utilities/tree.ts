/*
So we have 3 uses for trees in this framework
1. Scope tree
2. Element tree
3. Layer lineage generation.

We could pull in a third party tree solution.
This comes with the cost of a bigger bundle and more complexity.
If we needed a more complete suite of features, there is an argument for
pulling in a bigger dependency, but at this moment in time the use for a tree is
mainly as a data structure with very limited traversal.

We instead go for a data structure that does exactly what we need.
With enough flexibility to allow for the three scenarios to be
doable with minimal boilerplate.
*/
import type { Iterator } from './iterator-types.ts';


/** @internalexport */
export interface TreeNode<T> {
	parent?:  TreeNode<T>;
	children: TreeNode<T>[];
	data:     T;
}


/** @internalexport */
export class Tree<T, I> {

	constructor(public identifier: (node: TreeNode<T>) => I) {}
	public readonly nodes = new Map<I, TreeNode<T>>;
	public get roots() {
		const values = this.nodes.values();
		if (!('filter' in values))
			return [ ...values ].filter(node => node.parent === undefined);

		return (this.nodes.values() as Iterator<TreeNode<T>>)
			.filter(node => node.parent === undefined).toArray();
	}

	public getNode = (id: I) => this.nodes.get(id);
	public getData = (id: I) => this.nodes.get(id)?.data;
	public add = (node: TreeNode<T>) => {
		const nodeId = this.identifier(node);

		if (node.parent) {
			if (!node.parent.children.some(n => nodeId === this.identifier(n)))
				node.parent.children.push(node);
		}

		if (!this.nodes.has(nodeId))
			this.nodes.set(nodeId, node);

		return node;
	};

	public remove = (node: TreeNode<T>) => {
		if (node.parent) {
			const index = node.parent.children.indexOf(node);
			if (index > -1)
				node.parent.children.splice(index, 1);
		}

		this.nodes.delete(this.identifier(node));

		return node;
	};

	public clear = () => this.nodes.clear();

}

/** @internalexport */
export const traverse = <Node extends TreeNode<Node['data']>>(
	nodes: Node | Node[],
	action: (
		node: NoInfer<TreeNode<Node['data']>>,
		exit: () => void,
		exitBranch: () => void,
	) => void,
) => {
	let exit = false;
	let exitBranch = false;

	const flagExit = () => exit = true;
	const flagExitBranch = () => exitBranch = true;

	const followBranch = (node: TreeNode<Node['data']>) => {
		action(node, flagExit, flagExitBranch);

		if (exit)
			return 'return';

		if (exitBranch) {
			exitBranch = false;

			return 'continue';
		}

		for (const childNode of node.children)
			followBranch(childNode);

		return 'continue';
	};

	for (const node of Array.isArray(nodes) ? nodes : [ nodes ]) {
		const instruction = followBranch(node);
		if (instruction === 'return')
			return;

		if (instruction === 'continue')
			continue;
	}
};
