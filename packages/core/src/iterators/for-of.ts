export const forOf = <T extends Iterable<any>[]>(...iterables: T): ForOf<T> => new ForOf(iterables);


class ForOf<T extends Iterable<any>[]> {

	#iterables: T;
	constructor(iterables: T) {
		this.#iterables = iterables;
	}

	find(predicate: ForOfPredicate<T, boolean>): IterableTupleToUnion<T> | undefined {
		for (const iterable of this.#iterables) {
			let index = 0;
			for (const value of iterable) {
				const result = predicate(value, index, iterable);
				if (result)
					return value;

				index++;
			}
		}
	}

	includes(value: IterableTupleToUnion<T>): boolean {
		for (const iterable of this.#iterables) {
			for (const _value of iterable) {
				if (value === _value)
					return true;
			}
		}

		return false;
	}

	some(predicate: ForOfPredicate<T, boolean>): boolean {
		for (const iterable of this.#iterables) {
			let index = 0;
			for (const value of iterable) {
				const result = predicate(value, index, iterable);
				if (result)
					return true;

				index++;
			}
		}

		return false;
	}

	every(predicate: ForOfPredicate<T, boolean>): boolean {
		let result = false;

		for (const iterable of this.#iterables) {
			let index = 0;
			for (const value of iterable) {
				result = predicate(value, index, iterable);
				index++;
			}
		}

		return result;
	}

	forEach(predicate: ForOfPredicate<T, void>): void {
		for (const iterable of this.#iterables) {
			let index = 0;
			for (const value of iterable) {
				predicate(value, index, iterable);
				index++;
			}
		}
	}

	map<R>(predicate: ForOfPredicate<T, R>): R[] {
		const arr: R[] = [];

		for (const iterable of this.#iterables) {
			let index = 0;
			for (const value of iterable) {
				arr.push(predicate(value, index, iterable));
				index++;
			}
		}

		return arr;
	}

	reduce<R>(predicate: ForOfReducePredicate<T, R>, initialValue: R): R {
		let result: R | undefined = initialValue;

		for (const iterable of this.#iterables) {
			let index = 0;
			for (const value of iterable) {
				result = predicate(result, value, index, iterable);
				index++;
			}
		}

		return result;
	}

}


type MapKeyValueType<T> = T extends Map<infer K, infer V> ? [K, V] : never;
type SetValueType<T> = T extends Set<infer V> ? V : never;
type GeneratorValueType<T extends Generator> = T extends Generator<infer A, infer B> ? A | B : never;

type UnwrapIterableTuple<T extends Iterable<any>> = {
	[K in keyof T]: T[K] extends any[] ? T[K][number]
		: T[K] extends Map<any, any>    ? MapKeyValueType<T[K]>
			: T[K] extends Set<any>      ? SetValueType<T[K]>
				: T[K] extends Generator  ? GeneratorValueType<T[K]>
					: never
} & Record<number, unknown>;

type IterableTupleToUnion<T extends Iterable<any>> = UnwrapIterableTuple<T>[number];

type ForOfPredicate<T extends Iterable<any>[], R> =
	(value: IterableTupleToUnion<T>, index: number, obj: T[number]) => R;

type ForOfReducePredicate<T extends Iterable<any>[], R> =
	(acc: R, value: IterableTupleToUnion<T>, index: number, obj: T[number]) => R;
