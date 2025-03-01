/**
 * A ReflectMap<K, V> is a Map<K, V> which also tracks the reflected or reverse Map<V, K> internally.\
 * It allows you to directly access a value without knowing its key, without having to loop through the map.
 */
export class ReflectMap<K, V> extends Map<K, V> {

	protected readonly reflected: Map<V, K> = new Map();

	public override delete(key: K): boolean {
		if (super.has(key)) {
			const value = super.get(key)!;
			super.delete(key);
			this.reflected.delete(value);

			return true;
		}

		return false;
	}

	public deleteByValue(value: V): boolean {
		if (this.reflected.has(value)) {
			const key = this.reflected.get(value)!;
			this.reflected.delete(value);
			super.delete(key);

			return true;
		}

		return false;
	}

	public getKeyByValue(value: V): K | undefined {
		return this.reflected.get(value);
	}

	public hasValue(value: V): boolean {
		return this.reflected.has(value);
	}

	public override set(key: K, value: V): this {
		super.set(key, value);
		this.reflected.set(value, key);

		return this;
	}

	public override clear(): void {
		super.clear();
		this.reflected.clear();
	}

}
