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
		cleanup?.();
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
