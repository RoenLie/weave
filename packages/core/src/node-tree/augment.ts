import { Node } from './node.js';
import { type Key, type TreeNode } from './types.js';


export const $Augmented = Symbol();


export const augment = <
	TObj extends object,
	TProp extends Key,
>(
	obj: TObj,
	childProp: TProp,
	parent?: TreeNode<TObj, TProp>,
): TreeNode<TObj, TProp> => {
	const proxy = new Proxy(obj, {
		get(target, p, _receiver) {
			if (p === $Augmented)
				return true;

			if (p in node) {
				const value = node[p as keyof Node<TObj, TProp>];

				if (typeof value === 'function')
					return value.bind(node);

				return value;
			}

			return Reflect.get(target, p, _receiver);
		},
	}) as TreeNode<TObj, TProp>;

	const node = new Node(obj, childProp, proxy, parent);

	return proxy;
};
