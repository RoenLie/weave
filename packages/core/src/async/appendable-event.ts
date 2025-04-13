import { emitEvent } from '../dom/event.js';
import { createPromiseResolver } from './create-promise-resolver.js';
import { waitForPromises } from './wait-for-promise.js';


export type PauseableEvent = CustomEvent<{
	id:         string;
	addPromise: (promise: Promise<any>) => void;
}>;


export const pauseableEvent = async (element: HTMLElement, eventName: string): Promise<void> => {
	const [ promise, resolve, , id ] = createPromiseResolver();
	const promises = new Set([ promise ]);
	promise.finally(() => promises.delete(promise));

	const addPromise = (promise: Promise<any>) => {
		promises.add(promise);
		promise.finally(() => promises.delete(promise));
	};

	const windowResolve = (ev: CustomEvent<{ id: string; }>) => ev.detail.id === id && resolve();

	window.addEventListener(eventName, windowResolve as any);

	emitEvent(element, eventName, { detail: { id, addPromise } });

	await waitForPromises(promises);

	window.removeEventListener(eventName, windowResolve as any);
};
