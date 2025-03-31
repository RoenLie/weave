/**
 * Convert a `generated` async iterable to an array promise.
 */
export async function genToArray<T>(generated: AsyncIterable<T>): Promise<T[]> {
	const out: T[] = [];
	for await (const x of generated)
		out.push(x);

	return out;
}
