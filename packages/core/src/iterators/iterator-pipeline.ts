abstract class TransformIterable<T, R> {

	constructor(protected iterable: Iterable<T>) { }

	protected transformers: ((value: T, previous: T | undefined) => R)[] = [];

	abstract pipe<P>(transformer: (value: Exclude<T, undefined>, previous: T | undefined) => P): any;

	[Symbol.iterator](): Iterator<Exclude<R, undefined>> {
		const iterator = this.iterable[Symbol.iterator]();
		let hasNext = true;

		return {
			next: (): any => {
				let previous: R | undefined = undefined;

				while (hasNext) {
					const nextValue = iterator.next();
					let value: R = nextValue.value;

					if (nextValue.done) {
						hasNext = false;

						return { done: true, value: undefined };
					}

					let shouldYield = true;

					for (const transformer of this.transformers) {
						const result = transformer(
							value as unknown as T,
							previous as T,
						);

						if (result === undefined) {
							shouldYield = false;

							break;
						}

						value = result;
					}

					if (!shouldYield)
						continue;

					previous = value;

					return { done: false, value: value };
				}

				return { done: true, value: undefined };
			},
		};
	}

}


/** @internalexport */
export class IterableTransformer<T, R> extends TransformIterable<T, R> {

	constructor(iterable: Iterable<T>, transformers: ((value: T) => R)[]) {
		super(iterable);

		this.transformers.push(...transformers);
	}

	pipe<P>(
		transformer: (value: Exclude<T, undefined>, previous: T | undefined) => P,
	): IterableTransformer<P, P> {
		const iterable = this.iterable;

		return new IterableTransformer<P, P>(iterable as any, [ ...this.transformers, transformer as any ]);
	}

	toArray(): Exclude<R, undefined>[] {
		return [ ...this ];
	}

}


/** @internalexport */
export class IterablePipeline<T, R, O = T> extends TransformIterable<T, R> {

	constructor(iterable: Iterable<T>, transformers: ((value: T) => R)[]) {
		super(iterable);

		this.transformers.push(...transformers);
	}

	pipe<P>(
		transformer: (value: Exclude<T, undefined>, previous: T | undefined) => P,
	): IterablePipeline<P, P, O> {
		const iterable = this.iterable;

		return new IterablePipeline<P, P, O>(iterable as any, [ ...this.transformers, transformer as any ]);
	}

	toPipeline() {
		return (iterable: Iterable<O>): Exclude<R, undefined>[] => {
			return new IterableTransformer<O, R>(iterable, this.transformers as any).toArray();
		};
	}

}


type Unwrap<T extends Iterable<any>> = T extends Iterable<infer U> ? U : never;


export function iterate<T extends Iterable<any>>(): IterablePipeline<Unwrap<T>, unknown>;
export function iterate<T extends Iterable<any>>(iterable: T): IterableTransformer<Unwrap<T>, unknown>;
export function iterate<T>(iterable?: any): any {
	if (iterable)
		return new IterableTransformer<T, unknown>(iterable, []);

	return new IterablePipeline<T, unknown>([], []);
}
