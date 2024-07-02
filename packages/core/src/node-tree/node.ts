import { augment } from './augment.js';
import { type Key, type TreeNode } from './types.js';


export class Node<
	TObj extends object,
	TProp extends Key,
	TNode extends TreeNode<TObj, TProp> = TreeNode<TObj, TProp>
> {

	public get parent() {
		return this.#parent;
	}

	#parent?: TNode;
	#proxy: TNode;
	#original: TObj;
	#childProp: TProp;

	constructor(
		target: TObj,
		childProp: TProp,
		proxy: TNode,
		parent?: TNode,
	) {
		this.#proxy = proxy;
		this.#parent = parent;
		this.#original = target;
		this.#childProp = childProp;
	}

	public get isRoot() {
		return this.parent === undefined;
	}

	public unproxy = () => {
		return this.#original;
	};

	#walkDepthFirst(fn: (node: TNode) => void | false) {
		const traverse = (node: TNode) => {
			const cont = fn(node);
			if (cont === false)
				return;

			for (const childNode of node[this.#childProp] ?? [])
				traverse(childNode as TNode);
		};

		traverse(this.#proxy);
	}

	#walkBreath(fn: (node: TNode) => void | false) {
		const breadthTraverse = (node: TNode) => {
			const queue: TNode[] = [];
			queue.push(...(node[this.#childProp] ?? []) as TNode[]);

			while (queue.length > 0) {
				const node: TNode = queue.shift()!;
				if (fn(node) === false)
					return;

				const children = (node[this.#childProp] ?? []) as TNode[];
				queue.push(...children);
			}
		};

		breadthTraverse(this.#proxy);
	}

	public forEach(fn: (item: TNode) => void) {
		this.#walkDepthFirst(item => {
			fn(item);
		});

		//const traverse = (node: TNode) => {
		//	fn(node);

		//	for (const childNode of node[this.#childProp] ?? [])
		//		traverse(childNode as TNode);
		//};

		//traverse(this.#proxy);
	}

	public find(fn: (item: TNode) => boolean) {
		let item: TNode | undefined = undefined;

		this.#walkDepthFirst(node => {
			if (fn(node)) {
				item = node;

				return false;
			}
		});

		return item;
	}

	public filter(fn: (item: TNode) => boolean) {
		const items: TNode[] = [];

		this.#walkDepthFirst(node => {
			if (fn(node))
				items.push(node);
		});

		return items;
	}

	public some(fn: (item: TNode) => boolean) {
		return !!this.find(fn);
	}

	public every(fn: (item: TNode) => boolean) {
		let valid = true;

		this.#walkDepthFirst(node => {
			if (!fn(node))
				return valid = false;
		});

		return valid;
	}

	public push(...items: TObj[]) {
		this.#proxy[this.#childProp]
			?.push(...items.map(item => augment(item, this.#childProp, this.#proxy)));

		return this.#proxy[this.#childProp]?.length;
	}

	public unshift(...items: TObj[]) {
		this.#proxy[this.#childProp]
			?.unshift(...items.map(item => augment(item, this.#childProp, this.#proxy)));

		return this.#proxy[this.#childProp]?.length;
	}

	public remove() {
		const siblings = this.#parent?.[this.#childProp];
		if (!siblings?.length)
			return;

		const index = siblings.indexOf(this.#proxy);
		if (index === -1)
			return;

		siblings.splice(index, 1);
		this.#parent = undefined;

		return this.#proxy;
	}

}
