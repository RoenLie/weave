import { type Node } from './node.js';


export type Rec = Record<Key, any>;
export type Key = keyof any;


export type RootNode<TObj extends Rec, TProp extends Key> = {
	[key in TProp]?: TreeNode<TObj, TProp>[]
} & Node<TObj, TProp, TreeNode<TObj, TProp>>;


export type TreeNode<
	TObj extends Rec,
	TProp extends Key,
> = Omit<TObj, TProp>
& { [key in TProp]?: TreeNode<TObj, TProp>[] }
& Node<TObj, TProp, TreeNode<TObj, TProp>>;
