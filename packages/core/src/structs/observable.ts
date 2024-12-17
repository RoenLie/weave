import { nanoid } from 'nanoid';
import type { AsyncFn, Fn } from '../types/function.types.ts';
import type { Ctor } from '../types/class.types.ts';
import { compose, createMixin } from './compose.ts';


type Operation = 'add' | 'remove' | 'clear';


export type IObservable<T = unknown, TVal = any> = T & {
	[react](value: TVal, operation: Operation): void;
	/** Attaches a listener to the Observable, that will be called whenever state changes */
	observe(fn: (value: TVal, operation: Operation, from: T) => void): {
		id:        string;
		unobserve: () => void;
	};
	/** Removes a listener by id */
	unobserve(id: string): void;
	/** Removes all listeners */
	disconnect(): void
};


/** @internalexport */
export const react = Symbol();


export const ObservableMixin = createMixin<IObservable, any>(base => {
	class Observable extends base implements IObservable {

		private observers: Map<string, Fn | AsyncFn> = new Map();
		public observe(fn: (value: any, operation: Operation, from: any) => void) {
			const _id = nanoid(10);
			this.observers.set(_id, fn);

			return { id: _id, unobserve: () => this.unobserve(_id) };
		}

		public unobserve(id: string) {
			this.observers.delete(id);
		}

		public [react](value: any, operation: Operation) {
			this.observers.forEach(val => val(value, operation, this));
		}

		public disconnect() {
			this.observers.clear();
		}

	}

	return Observable;
});


export const makeObservableBase = <TBase extends Ctor>(base: TBase) =>
	compose(base).with(ObservableMixin) as new <TBase, TVal>() => IObservable<TBase, TVal>;


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


export class ObservableMap<K, V> extends makeObservableBase(Map)<Map<K, V>, { key?: K, value?: V }> {

	public override set(key: K, value: V): this {
		const res = super.set(key, value);
		this[react]({ key, value }, 'add');

		return res;
	}

	public override delete(key: K): boolean {
		const res = super.delete(key);
		this[react]({ key }, 'remove');

		return res;
	}

	public override clear(): void {
		super.clear();
		this[react]({}, 'clear');
	}

}
