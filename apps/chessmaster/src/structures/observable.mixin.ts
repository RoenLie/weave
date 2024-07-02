import { AsyncFn, createMixin, Ctor, Fn, mixCls } from '@eyeshare/shared';
import { nanoid } from 'nanoid';

/* ------------------------------------------------- */

type Operation = 'add' | 'remove' | 'clear';

export type IObservable<T = unknown, TVal = any> = T & {
	/** @internal */
	[reaction](value: TVal, operation: Operation): void;
	/** Attaches a listener to the Observable, that will be called whenever state changes */
	observe(fn: (from: T, value: TVal, operation: Operation) => void): { id: string; unobserve: () => void; };
	/** Removes a listener by id */
	unobserve(id: string): void;
	/** Removes all listeners */
	disconnect(): void
};

export const reaction = Symbol();

export const ObservableMixin = createMixin<IObservable, any>(base => {
	class Observable extends base implements IObservable {

		private observers = new Map<string, Fn | AsyncFn>();
		private history: {from: any; value: any; operation: Operation;}[] = [];

		public observe(fn: (from: any, value: any, operation: Operation) => void) {
			const id = nanoid(10);
			this.observers.set(id, fn);

			return { id, unobserve: () => this.unobserve(id) };
		}

		public unobserve(id: string) {
			this.observers.delete(id);
		}

		public [reaction](value: any, operation: Operation) {
			this.history.push({ value, operation });
			this.observers.forEach(val => val(this, value, operation));
		}

		public disconnect() {
			this.observers.clear();
		}

	}

	return Observable;
});

export const makeObservableBase = <TBase extends Ctor>(base: TBase) =>
	mixCls(base).with(ObservableMixin) as { new <TBase, TVal>(): IObservable<TBase, TVal>; };
