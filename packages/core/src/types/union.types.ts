import type { CompatibilityOf } from './utility-types.js';

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never


type LastOf<T> = UnionToIntersection<T extends any ? () => T : never> extends () => (infer R) ? R : never


type Push<T extends any[], V> = [...T, V];


export type UnionToTuple<T, L = LastOf<T>, N = [T] extends [never] ? true : false> =
  true extends N ? [] : Push<UnionToTuple<Exclude<T, L>>, L>


/** LastInUnion<1 | 2> = 2 */
export type LastInUnion<U> = UnionToIntersection<
	U extends unknown ? (x: U) => 0 : never
> extends (x: infer L) => 0 ? L : never;


/**
 * Does the union of `Keys` contain at least one literal key,
 * meaning a key which is not the generic non-literal `string | symbol | number`?
 */
export type HasLiteralKey<Keys extends keyof any, Key = LastInUnion<Keys>> = [Keys] extends [never]
	? false
	: CompatibilityOf<Key, string> extends 'similar'
		? true
		: CompatibilityOf<Key, number> extends 'similar'
			? true
			: CompatibilityOf<Key, symbol> extends 'similar'
				? true
				: HasLiteralKey<Exclude<Keys, Key>>;
