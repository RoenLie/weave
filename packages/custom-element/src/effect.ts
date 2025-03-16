import { Signal } from 'signal-polyfill';


let needsEnqueue = true;


const watcher = new Signal.subtle.Watcher(() => {
	if (needsEnqueue) {
		needsEnqueue = false;
		queueMicrotask(processPending);
	}
});


function processPending() {
	needsEnqueue = true;

	for (const s of watcher.getPending())
		s.get();

	watcher.watch();
}


export function effect(callback: () => any) {
	let cleanup: ((...args: any) => any) | undefined = undefined;

	const computed = new Signal.Computed(() => {
		cleanup?.();
		cleanup = callback();
	});

	watcher.watch(computed);
	computed.get();

	return (): void => {
		watcher.unwatch(computed);

		cleanup?.();
		cleanup = undefined;
	};
};
