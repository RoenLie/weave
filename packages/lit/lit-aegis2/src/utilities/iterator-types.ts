/**
 * @internalexport
 * This is used as a typing shim for the Iterator interface.
*/
export interface Iterator<T> extends IterableIterator<T> {
	drop(limit: number): Iterator<T>;
	every(callbackfn: (value: T, counter: number) => boolean): boolean;
	filter(callbackfn: (value: T, counter: number) => boolean): Iterator<T>;
	find(callbackfn: (value: T, counter: number) => boolean): T;
	flatMap(callbackfn: (value: T, counter: number) => Iterable<T> | Iterator<T>): Iterator<T>;
	forEach(callbackfn: (value: T, counter: number) => void): void;
	map(callbackfn: (value: T, counter: number) => T): Iterator<T>;
	reduce<I, O = I>(callbackfn: (memo: O, value: T, counter: number) => O, initialValue: I): O;
	some(callbackfn: (value: T, counter: number) => boolean): boolean;
	take(limit: number): Iterator<T>;
	toArray(): T[];
}
