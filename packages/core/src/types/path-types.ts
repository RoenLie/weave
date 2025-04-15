/* eslint-disable @stylistic/max-len */
import type { O, U } from 'ts-toolbelt';
import type { Greater } from 'ts-toolbelt/out/Number/Greater.js';

import type { ObjectHasKeys, ObjectHasLiteralKeys, ObjectTypesToUnion } from './record.types.ts';


/** A `Path` is a dot-separated string of segments representing nested properties in an object graph. */
export type Path = string;


/**
 * Get the type of the property specified by the path
 *
 * @example
 * ```
 * type TypeOfAB = PathValue<{ a: { b: { c: string } }, 'a.b'>
 * // { c: string }
 * ```
 */
export type PathValue<TTarget extends Record<keyof any, any>, TPath extends string> = ObjectHasLiteralKeys<TTarget> extends false
	? any
	: TPath extends `${ infer Head }.${ infer Tail }`
		? MergeObjectUnion<TTarget[Head]> extends object
			? PathValue<MergeObjectUnion<TTarget[Head]>, Tail>
			: never
		: TTarget[TPath];

/**
 * Extracts out the keys of the given type as dot separated paths.
 *
 * @example
 * ```
 * {
 * 	key1: string;
 * 	key2: {
 *   		sub1: string;
 * 		sub2: string
 * 	}
 * }
 * ```
 * Will be extracted as:
 * 	'key1' | 'key2' | 'key2.sub1' | 'key2.sub2'
 *
 * Depth of search can be set using the third parameter `TDepth` (default 6).
 */
export type PathOf<TTarget extends Record<keyof any, any>> = ObjectHasLiteralKeys<TTarget> extends true
	? PathOfInternal<TTarget, false, []>
	: Path;


/**
 * Extracts out the keys of the given type as dot separated paths. Includes only paths to the leaf nodes.
 *
 * @example
 * ```
 * {
 * 	key1: string;
 * 	key2: {
 *   		sub1: string;
 * 		sub2: string
 * 	}
 * }
 * ```
 * Will be extracted as:
 * 	'key1' | 'key2.sub1' | 'key2.sub2'
 *
 * Depth of search can be set using the third parameter `TDepth` (default 6).
 */
export type PathOfLeaf<TTarget extends Record<keyof any, any>> = ObjectHasLiteralKeys<TTarget> extends true
	? PathOfInternal<TTarget, true, []>
	: Path;


/** Internal recursive implementation of dotted paths. */
type PathOfInternal<
	TTarget extends Record<keyof any, any>,
	TLeafOnly extends boolean,
	IIteration extends number[],
> = ObjectTypesToUnion<PropertyNameMap<TTarget, TLeafOnly, [...IIteration, 1]>> & Path;


/** Merge a union of objects so that we can iterate the keys. */
type MergeObjectUnion<T extends object> = O.MergeAll<object, U.ListOf<T>, 'flat'>;


/** Creates a piece of the property path of a given key (key) in the given object (T) */
type SubPathsOf<
	TTarget extends Record<keyof any, any>,
	TKey extends keyof TTarget,
	TLeafOnly extends boolean,
	IIteration extends number[],
> = `${ (string | number) & TKey }.${ (string | number) & PathOfInternal<Extract<TTarget[TKey], object>, TLeafOnly, IIteration> }`;


/**
 * Takes in an object, returns a type where the value of each top level
 * key is all the possible paths to the leaf nodes of that keys object.
 *
 * @example
   type tester = {
	child1: "child1" | "child1.deadEnd" | "child1.leaf.end" | "child1.leaf.finish" | "child1.leaf.complete" | "child1.leaf.a" | "child1.leaf.123" | "child1.leaf";
	child2: "child2" | ... 6 more ... | "child2.leaf";
	child3: "child3" | ... 6 more ... | "child3.leaf";
	123: "123";
	}
 */
type PropertyNameMap<
	TTarget extends Record<keyof any, any>,
	TLeafOnly extends boolean = false,
	IIteration extends number[] = [],
> = {
	[Key in keyof TTarget]-?: [Extract<Required<TTarget>[Key], object>] extends [never]
		? `${ (string | number) & Key }`
		: Greater<IIteration['length'], 6> extends 1
			? never
			: ObjectHasKeys<Extract<TTarget[Key], object>> extends true
				? SubPathsOf<Required<TTarget>, Key, TLeafOnly, IIteration> | (TLeafOnly extends false ? `${ (string | number) & Key }` : never)
				: `${ (string | number) & Key }`
};


//// Example types
//interface LeafInterface {
//	end: symbol;
//	finish: number | undefined;
//	complete: string;
//}

//interface ChildInterface {
//	leaf: LeafInterface | { a: number, [123]: string } | string;
//	deadEnd: true;
//}

//interface ParentInterface {
//	child1?: ChildInterface;
//	child2: ChildInterface;
//	child3: ChildInterface;
//	[123]?: number;
//}

//declare const pathsOf_onlyLeafNodes: (key: PathOfLeaf<ParentInterface>) => void;
//declare const pathsOf_allNodes: (key: PathOf<ParentInterface>) => void;
//declare const returnType: <TObj extends object, TPath extends PathOf<TObj>>(_obj: TObj, _path: TPath) => PathValue<TObj, TPath>;
//declare const parent: ParentInterface;
//export const get123 = returnType(parent, '123');
//export const getChild3 = returnType(parent, 'child3');
//export const getChild3Leaf = returnType(parent, 'child3.leaf');
//export const getChild3LeafA = returnType(parent, 'child3.leaf.a');
//export const getChild3LeafFinish = returnType(parent, 'child3.leaf.finish');
//export const getChild3Leaf123 = returnType(parent, 'child1.leaf.123');
//export const getDynamicRec = returnType({} as Record<keyof any, any>, 'some.dynamic.path');


//// Valid
//pathsOf_onlyLeafNodes('child3.deadEnd');
//pathsOf_onlyLeafNodes('child1.leaf.complete');
//pathsOf_onlyLeafNodes('child3.leaf.finish');
//pathsOf_allNodes('child1.leaf');

//// Not valid
//// @ts-expect-error
//pathsOf_onlyLeafNodes('child4.no');
//// @ts-expect-error
//pathsOf_onlyLeafNodes('child3');
//// @ts-expect-error
//returnType(parent, 'child3.leaf.other');
