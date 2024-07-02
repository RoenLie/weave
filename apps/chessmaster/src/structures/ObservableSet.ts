import { makeObservableBase, react } from '../../mixins/observable.mixin.js';

/* ------------------------------------------------- */

export class ObservableSet<V> extends makeObservableBase(Set)<Set<V>, { value?: V }> {

	public override add(value: V): this {
		const res = super.add(value);
		this[react]({ value }, 'add');

		return res;
	}

	public override delete(value: V): boolean {
		const res = super.delete(value);
		this[react]({ value }, 'remove');

		return res;
	}

	public override clear(): void {
		super.clear();
		this[react]({}, 'clear');
	}

}
