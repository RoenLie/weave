import { $Augmented, augment } from './augment.js';
import { type Key, type Rec, type RootNode, type TreeNode } from './types.js';


export const fromSingleObject = <TObj extends Rec, const TProp extends keyof TObj>(
	object: TObj, childProp: TProp): TreeNode<TObj, TProp> => _traverse(object, childProp);


export const fromMultiObject = <TObj extends Rec, const TProp extends keyof TObj>(
	object: TObj[], childProp: TProp,
): RootNode<TObj, TProp> => {
	type Root = { [key in TProp]: TObj[]; } & TObj;

	return _traverse({
		[childProp]: object,
	} as Root, childProp);
};


const _traverse = <TObj extends Rec, const TProp extends keyof TObj>(
	obj: TObj, childProp: TProp, parent?: TreeNode<TObj, TProp>,
): TreeNode<TObj, TProp> => {
	if (obj[$Augmented])
		return obj as unknown as TreeNode<TObj, TProp>;

	const augmented = augment(obj, childProp, parent);

	const children = augmented[childProp] as TObj[] ?? [];
	children.splice(0, children.length,
		...children.map(child => _traverse(child, childProp, augmented) as unknown as TObj));

	return augmented;
};


type Item<
	TObj extends Rec,
	TIdProp extends keyof TObj,
	TParentProp extends keyof TObj,
	TChildProp extends string,
> = TObj & {
	[key in TIdProp]?: Key;
} & {
	[key in TParentProp]?: Key;
} & {
	[key in TChildProp]?: Item<TObj, TIdProp, TParentProp, TChildProp>[];
};

export const fromList = <
	TObj extends Rec,
	TIdProp extends keyof TObj,
	TParentProp extends keyof TObj,
	TChildProp extends string,
>(
	list: TObj[],
	idProp: TIdProp,
	parentProp: TParentProp,
	childProp: TChildProp,
): RootNode<Item<TObj, TIdProp, TParentProp, TChildProp>, TChildProp> => {
	type _Item = Item<TObj, TIdProp, TParentProp, TChildProp>;

	const objMap: Map<string | number, _Item> = new Map();
	list.forEach(listItem => objMap.set(listItem[idProp], { ...listItem }));

	const roots: _Item[] = [];

	objMap.forEach(item => {
		// If it has a parent, attach it as a child of that parent.
		if (item[parentProp]) {
			const parent = objMap.get(item[parentProp])!;
			(parent[childProp] as _Item[] | undefined) ??= [] as _Item[];
			parent[childProp].push(item);
		}
		else {
			roots.push(item);
		}
	});

	return fromMultiObject(roots, childProp);
};


export const unwrap = <
	TObj extends TreeNode<Rec, TProp>,
	TProp extends keyof TObj,
>(object: TObj, childProp: TProp): ReturnType<TObj['unproxy']> => {
	type Original = ReturnType<TObj['unproxy']>;

	const traverse = (obj: TObj) => {
		if (!(obj as any)[$Augmented])
			return obj as Original;

		const unwrapped = obj.unproxy() as Original;

		const children = (unwrapped[childProp] ?? []) as Original[];
		for (let i = 0; i < children.length; i++) {
			const child = children[i]!;

			const unwrappedChild = traverse(child);
			children.splice(i, 1, unwrappedChild);
		}

		return unwrapped;
	};

	return traverse(object);
};


export class NodeTree {

	static fromObject<TObj extends Rec, TProp extends keyof TObj>(
		objects: TObj[], childProp: TProp
	): RootNode<TObj, TProp>;

	static fromObject<TObj extends Rec, TProp extends keyof TObj>(
		objects: TObj, childProp: TProp
	): TreeNode<TObj, TProp>;

	static fromObject<TObj extends Rec, TProp extends keyof TObj>(
		objects: TObj | TObj[], childProp: TProp,
	): TreeNode<TObj, TProp> | RootNode<TObj, TProp> {
		if (Array.isArray(objects))
			return fromMultiObject(objects, childProp);

		return fromSingleObject(objects, childProp);
	}

	static fromList = fromList;

	static unwrap = unwrap;

}
