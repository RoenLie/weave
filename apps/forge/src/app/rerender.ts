import { Signal, signal } from '@lit-labs/preact-signals';


const signalProp = '__signals';


/**
 * Creates getter setters that accesses a signal as a way
 * to tie the use of this property into the signal rerender detection mechanism.
 */
export const signalState = () => {
	return (target: Record<keyof any, any>, property: string) => {
		const initialize = (target: object) => {
			if (signalProp in target)
				return;

			const proxy = new Proxy({} as Record<keyof any, any>, {
				get(target, p) {
					target[p] ??= signal<any>(undefined);

					return Reflect.get(target, p);
				},
				set() {
					return true;
				},
			});

			Object.defineProperty(target, signalProp, {
				writable:     false,
				enumerable:   false,
				configurable: false,
				value:        proxy,
			});
		};

		Object.defineProperty(target, property, {
			get() {
				initialize(this);

				return this[signalProp][property].value;
			},
			set(v: any) {
				initialize(this);

				this[signalProp][property].value = v;
			},
		});
	};
};


export const getSignal = <T extends Record<keyof any, any>, K extends keyof T>(
	target: T, property: K,
): Signal<T[K]> => target[signalProp][property];
