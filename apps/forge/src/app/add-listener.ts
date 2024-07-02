/* eslint-disable max-len */
interface WindowListener {
	addEventListener<K extends keyof WindowEventHandlersEventMap>(type: K, listener: (this: HTMLElement, ev: WindowEventHandlersEventMap[K]) => any, options?: boolean | AddEventListenerOptions): () => void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): () => void;
}
interface BodyListener {
	addEventListener<K extends keyof HTMLBodyElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLBodyElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): () => void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): () => void;
}
interface ElementListener {
	addEventListener<K extends keyof ElementEventMap>(type: K, listener: (this: HTMLElement, ev: ElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): () => void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): () => void;
}
interface HTMLElementListener {
	addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): () => void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): () => void;
}


export const addListener = <T extends HTMLElement | Element | Window | Document>(parent: T) => {
	const proxy = new Proxy(parent.addEventListener, {
		apply(target, thisArg, argArray) {
			Reflect.apply(target, parent, argArray);

			return () => parent.removeEventListener(argArray[0], argArray[1]);
		},
	});

	type Listener = T extends HTMLElement ? HTMLElementListener['addEventListener']
		: T extends Element ? ElementListener['addEventListener']
			: T extends Body ? BodyListener['addEventListener']
				: T extends Window ? WindowListener['addEventListener']
					: never & Record<never, never>;

	return proxy as Listener;
};
