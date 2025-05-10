/**
 * A MirrorMap<K, V> is a Map<K, V> which also tracks the reverse Map<V, K> internally.\
 * It allows you to directly access a value without knowing its key, without having to loop through the map.
 */
export class MirrorMap<K, V> extends Map<K, V> {

	protected readonly mirror: Map<V, K> = new Map();

	override delete(key: K): boolean {
		if (super.has(key)) {
			const value = super.get(key)!;
			super.delete(key);
			this.mirror.delete(value);

			return true;
		}

		return false;
	}

	deleteByValue(value: V): boolean {
		if (this.mirror.has(value)) {
			const key = this.mirror.get(value)!;
			this.mirror.delete(value);
			super.delete(key);

			return true;
		}

		return false;
	}

	getKeyByValue(value: V): K | undefined {
		return this.mirror.get(value);
	}

	hasValue(value: V): boolean {
		return this.mirror.has(value);
	}

	override set(key: K, value: V): this {
		if (this.has(key))
			this.mirror.delete(this.get(key)!);

		super.set(key, value);
		this.mirror.set(value, key);

		return this;
	}

	override clear(): void {
		super.clear();
		this.mirror.clear();
	}

}
