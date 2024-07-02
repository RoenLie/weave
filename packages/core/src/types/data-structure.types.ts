export interface Vector2 {x: number; y: number}


export interface Vector3 {x: number; y: number; z: number;}


export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };


/**
 * Generates a public interface type that removes private and protected fields.
 * This allows accepting otherwise compatible versions of the type (e.g. from
 * multiple copies of the same package in `node_modules`).
 */
export type Interface<T> = {
	[K in keyof T]: T[K];
} & unknown;
