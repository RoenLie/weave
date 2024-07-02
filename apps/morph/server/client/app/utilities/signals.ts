import type { Signal } from '@lit-labs/preact-signals';


export const subOnce = <T extends Signal>(
	signal: T, fn: (value: T['value']) => void,
) => {
	let hasRun = false;

	const unsub = signal.subscribe(value => {
		if (hasRun) {
			unsub();

			return fn(value);
		}

		hasRun = true;
	});
};
