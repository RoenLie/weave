export interface ReadonlyMapConstructor {
	new (): ReadonlyMap<any, any>;
	new <K, V>(
		entries?: readonly (readonly [K, V])[] | Iterable<readonly [K, V]> | null
	): ReadonlyMap<K, V>;
	readonly prototype: ReadonlyMap<any, any>;
}


export const ReadonlyMap = (() => {
	const map = class ReadonlyMap<K = PropertyKey, V = unknown> extends Map<K, V> {

		constructor(entries?: Map<K, V>) {
			super(entries);

			const me = (this as any);
			me.set = undefined;
			me.clear = undefined;
			me.delete = undefined;
		}

	} as unknown as ReadonlyMapConstructor;

	return map as ReadonlyMapConstructor;
})();
