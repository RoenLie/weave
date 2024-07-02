import type { ListOf } from 'ts-toolbelt/out/Union/ListOf.js';

import type { HasLiteralKey } from './union.types.js';


/**
 * Makes T indexable.
 *
 * Constraints on key types and value can be supplies
 * as second and third parameters respectively.
 */
export type RecordOf<
	T extends object = object,
	TK extends keyof any = keyof any, TV = any
> = T & Record<TK, TV>;


/**
 * Union of the type of all keys of `T`.
 */
export type ValueOf<T> = T[keyof T];


/**
 * Turns a unclean object type into a singel object.
 */
export type ComputedFlat<A> = { [K in keyof A]: A[K]; } & unknown


/** Mirrors the object key names as the object key value types. */
export type ObjectKeyToType<T> = { [Key in keyof T]: Key };


/** Takes all the types of the values in an object and returns it as a union type. */
export type ObjectTypesToUnion<T> = T extends Record<keyof any, never>
	? never
	: T extends {[Key in keyof T]: infer Type}
		? Type
		: never


/** Takes all the keys in an object and returns them as a union type. */
export type ObjectKeysToUnion<T> = ObjectTypesToUnion<ObjectKeyToType<T>>;


/** Converts an object into a tuple type. */
export type ObjectToTuple<T> = ListOf<ObjectKeysToUnion<T>>;


/** Returns the amount of keys in an object. */
export type ObjectLength<T> = ObjectToTuple<T>['length'];


/** Returns true or false depending on if an object has keys. */
export type ObjectHasKeys<T extends object> = ObjectLength<T> extends 0 ? false : true;


/** Does `T` contain at least one non-indexed property, aka. a literal key? */
export type ObjectHasLiteralKeys<T extends object> = HasLiteralKey<keyof T>;


/**
 * Creates an object with the provided list of `TKeys` where each value is a `TVal`
 *
 * If the list of `TKeys` is empty a record of `TVal` is created instead.
 */
export type ObjectOfKeys<TKeys extends readonly string[], TVal = any> = TKeys extends []
	? Record<string, TVal>
	: ComputedFlat<Record<TKeys[number], TVal>>;
