export function* iterate<T extends Record<keyof any, any> | Iterable<any>>(
	items: T | undefined,
	func: (value: T[keyof T], index: T extends Iterable<any> ? number : keyof T) => unknown,
	sort?: (a: T[keyof T], b: T[keyof T]) => number,
) {
	if (items === undefined)
		return;

	// Array, map, set, string, etc.
	if (isIterable(items)) {
		let i = 0;

		if (Array.isArray(items)) {
			if (sort) {
				const order: number[] = items.map((_, i) => i)
					.sort((a, b) => sort(items[a], items[b]));

				for (const value of order)
					yield func(items[value], i++ as any);
			}
			else {
				for (const value of items)
					yield func(value, i++ as any);
			}
		}
		else {
			if (sort) {
				// Don't know how to sort this
				// Defering implementation until needed
				throw new Error('sorting a non-array iterable is not supported');
			}
			else {
				for (const value of items)
					yield func(value, i++ as any);
			}
		}
	}
	// Object
	else {
		if (sort) {
			const order: (keyof T)[] | undefined = Object.keys(items).sort(
				(a, b) => sort(items![a as keyof T], items![b as keyof T]),
			) as (keyof T)[];

			for (const key of order)
				yield func(items[key as keyof T], key as any);
		}
		else {
			for (const key in items)
				yield func(items[key] as T[keyof T], key as any);
		}
	}
}


const isIterable = (items: any): items is Iterable<any> => (items as any)?.[Symbol.iterator];
