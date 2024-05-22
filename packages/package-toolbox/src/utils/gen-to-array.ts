/**
 * Convert a `generated` async iterable to an array promise.
 * This is the same as in @eyeshare/shared
 * duplicate put in here to avoid needing a dependency on shared.
 */
export async function genToArray<T>(generated: AsyncIterable<T>): Promise<T[]> {
	const out: T[] = [];
	for await (const x of generated)
		out.push(x);

	return out;
}
