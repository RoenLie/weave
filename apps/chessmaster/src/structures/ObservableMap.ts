import { nanoid } from 'nanoid';


type Observation<K, V> = {
	key: K;
	value: V;
	operation: 'add'
} | {
	key: K;
	before: V;
	after: V;
	operation: 'replace'
} | {
	key: K;
	value: V;
	operation: 'remove'
} | {
	key?: undefined;
	value?: undefined;
	operation: 'clear'
}


export class ObservableMap<K, V> extends Map<K, V> {

	private _observers = new Map<
		string,
		((obs: Observation<K, V>, map: this) => any) |
		((obs: Observation<K, V>, map: this) => Promise<any>)
	>();

	private _history: Observation<K, V>[] = [];

	public override set(key: K, value: V): this {
		const before = this.has(key) && this.get(key);
		const res = super.set(key, value);

		if (before)
			this.reaction({ key, before, after: value, operation: 'replace' });
		else
			this.reaction({ key, value, operation: 'add' });

		return res;
	}

	public override delete(key: K): boolean {
		const value = this.get(key)!;
		const res = super.delete(key);
		this.reaction({ key, value, operation: 'remove' });

		return res;
	}

	public override clear(): void {
		super.clear();
		this.reaction({ operation: 'clear' });
	}

	public history() {
		return this._history;
	}

	public clearHistory() {
		this._history.length = 0;
	}

	public observe(fn: (obs: Observation<K, V>, map: this) => void) {
		const id = nanoid();
		this._observers.set(id, fn);

		return { id, unobserve: () => this.unobserve(id) };
	}

	public unobserve(id: string) {
		this._observers.delete(id);
	}

	public disconnect() {
		this._observers.clear();
	}

	private reaction(obs: Observation<K, V>) {
		this._history.push(obs);
		this._observers.forEach(fn => fn(obs, this));
	}

}
