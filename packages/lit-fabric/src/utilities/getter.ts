export class Getter<T = any> {

	public static bind(getter: Getter, name: string, ref: Record<keyof any, any>) {
		getter.#name = name;
		getter.#ref = new WeakRef(ref);
	}

	#name: string;
	#ref: WeakRef<Record<keyof any, any>>;

	public get value(): T {
		return this.#ref.deref()?.[this.#name];
	}

}
