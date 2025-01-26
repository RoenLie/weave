import { Signal } from 'signal-polyfill';


let needsEnqueue = true;


const w = new Signal.subtle.Watcher(() => {
	if (needsEnqueue) {
		needsEnqueue = false;
		queueMicrotask(processPending);
	}
});


function processPending() {
	needsEnqueue = true;

	for (const s of w.getPending())
		s.get();

	w.watch();
}


export function effect(callback: () => any) {
	let cleanup: ((...args: any) => any) | undefined = undefined;

	const computed = new Signal.Computed(() => {
		typeof cleanup === 'function' && cleanup();
		cleanup = callback();
	});

	w.watch(computed);
	computed.get();

	return () => {
		w.unwatch(computed);

		cleanup?.();
		cleanup = undefined;
	};
}


export function signal<C, V>(
	target: ClassAccessorDecoratorTarget<C, V>,
	context: ClassAccessorDecoratorContext<C, V>,
): ClassAccessorDecoratorResult<C, V> {
	const { get } = target;

	context.addInitializer(function() {
		(this as any).__signalProps ??= [];
		(this as any).__signalProps.push(context.name);
	});

	return {
		get() {
			const signal = (get.call(this) as Signal.State<V>);

			return signal.get();
		},
		set(value: V) {
			const signal = (get.call(this) as Signal.State<V>);
			signal.set(value);
		},
		init(value: any): any {
			return new Signal.State(value);
		},
	};
}
