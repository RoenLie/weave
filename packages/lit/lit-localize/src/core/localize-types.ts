import type { Increment } from '@roenlie/core/types';


export type DirectiveString = string & Record<never, never>;


export type Dynamic<T> = T | Promise<T> | (() => Promise<T>) | (() => T);


export type TermTupleArray<T extends string[]> = _TermTupleArray<T, 0, []>;
type _TermTupleArray<
	Blueprint extends string[],
	Index extends number,
	Arr extends [string, string][]
> = Blueprint[Index] extends string
	? _TermTupleArray<Blueprint, Increment<Index>, [...Arr, [Blueprint[Index], string]]>
	: Arr;
