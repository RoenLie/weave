/**
 * A ReflectMap<K, V> is a Map<K, V> which also tracks the reflected or reverse Map<V, K> internally.
 * It allows you to directly access a value without knowing its key, without having to loop through the map.
 */
export class ReflectMap<K, V> extends Map<K, V> {

	private readonly _reflected = new Map<V, K>();

	public override delete(key: K): boolean {
		if (super.has(key)) {
			const value = super.get(key)!;
			super.delete(key);
			this._reflected.delete(value);

			return true;
		}

		return false;
	}

	/**
	 * @returns true if an element in the Map existed and has been removed, or false if the element does not exist.
	 */
	public deleteByValue(value: V): boolean {
		if (this._reflected.has(value)) {
			const key = this._reflected.get(value)!;
			this._reflected.delete(value);
			super.delete(key);

			return true;
		}

		return false;
	}

	/**
	 * Returns a specified key from the ReflectMap object. If the key that is associated to the provided value is an object,
	 * then you will get a reference to that object and any change made to that object will effectively modify it inside the Map.
	 * @returns Returns the element associated with the specified value. If no element is associated with the specified value, undefined is returned.
	 */
	public getKeyByValue(value: V): K | undefined {
		return this._reflected.get(value);
	}

	/**
	 * @returns true if the value exists in the reflected map.
	 */
	public hasValue(value: V): boolean {
		return this._reflected.has(value);
	}

	/**
	 * Adds a new element with a specified key and value to the Map. If an element with the same key already exists, the element will be updated.
	 */
	public override set(key: K, value: V): this {
		super.set(key, value);
		this._reflected.set(value, key);

		return this;
	}

	public override clear(): void {
		super.clear();
		this._reflected.clear();
	}

}
