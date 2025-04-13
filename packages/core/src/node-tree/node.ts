import { augment } from './augment.js';
import { type Key, type TreeNode } from './types.js';


export class Node<
	TObj extends object,
	TProp extends Key,
	TNode extends TreeNode<TObj, TProp> = TreeNode<TObj, TProp>,
> {

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

	get parent(): TNode | undefined {
		return this.#parent;
	}

	#parent?:   TNode;
	#proxy:     TNode;
	#original:  TObj;
	#childProp: TProp;

	get isRoot(): boolean {
		return this.parent === undefined;
	}

	unproxy(): TObj { return this.#original; };

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

	forEach(fn: (item: TNode) => void): void {
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

	find(fn: (item: TNode) => boolean): TNode | undefined {
		let item: TNode | undefined = undefined;

		this.#walkDepthFirst(node => {
			if (fn(node)) {
				item = node;

				return false;
			}
		});

		return item;
	}

	filter(fn: (item: TNode) => boolean): TNode[] {
		const items: TNode[] = [];

		this.#walkDepthFirst(node => {
			if (fn(node))
				items.push(node);
		});

		return items;
	}

	some(fn: (item: TNode) => boolean): boolean {
		return !!this.find(fn);
	}

	every(fn: (item: TNode) => boolean): boolean {
		let valid = true;

		this.#walkDepthFirst(node => {
			if (!fn(node))
				return valid = false;
		});

		return valid;
	}

	push(...items: TObj[]): number {
		this.#proxy[this.#childProp]
			?.push(...items.map(item => augment(item, this.#childProp, this.#proxy)));

		return this.#proxy[this.#childProp]?.length ?? 0;
	}

	unshift(...items: TObj[]): number {
		this.#proxy[this.#childProp]
			?.unshift(...items.map(item => augment(item, this.#childProp, this.#proxy)));

		return this.#proxy[this.#childProp]?.length ?? 0;
	}

	remove(): TNode | undefined {
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
