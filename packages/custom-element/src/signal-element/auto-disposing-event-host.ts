import { PreConnectHost } from './pre-connect-host.ts';


type EventMap = HTMLElementEventMap;
type AddEventOptions = boolean | AddEventListenerOptions;
type EventOptions = boolean | EventListenerOptions;
type Listener = EventListener | EventListenerObject;


export class DisposingEventHost extends PreConnectHost {

	/**
	 * Called when the element is disconnected from the DOM.
	 */
	protected override disconnected(): void {
		this.removeAllEventListeners();
	}

	#listeners?: Map<string, Set<WeakRef<readonly [
		original: Listener,
		bound: Listener,
		options?: boolean | AddEventListenerOptions,
	]>>>;

	override addEventListener<K extends keyof EventMap>(
		type: K, listener: (this: HTMLElement, ev: EventMap[K]) => any, options?: AddEventOptions): void;
	override addEventListener(type: string, listener: Listener, options?: AddEventOptions): void;
	override addEventListener(type: string, listener: Listener, options?: AddEventOptions): void {
		this.#listeners ??= new Map();

		if (typeof listener === 'function') {
			const set = this.#listeners.get(type)
				?? this.#listeners.set(type, new Set()).get(type)!;

			const bound = listener.bind(this);
			const ref = new WeakRef([ listener, bound, options ] as const);
			set.add(ref);

			listener = bound;
		}

		super.addEventListener(type, listener, options);
	}

	override removeEventListener<K extends keyof EventMap>(
		type: K, listener: (this: HTMLElement, ev: EventMap[K]) => any, options?: EventOptions): void;
	override removeEventListener(type: string, listener: Listener, options?: EventOptions): void;
	override removeEventListener(type: string, listener: Listener, options?: EventOptions): void {
		if (typeof listener === 'function' && this.#listeners) {
			for (const [ type, refs ] of this.#listeners) {
				for (const ref of refs) {
					const unwrapped = ref.deref() ?? void refs.delete(ref);
					if (unwrapped) {
						const [ original, bound, options ] = unwrapped;
						if (listener === original) {
							super.removeEventListener(type, bound, options);
							refs.delete(ref);
						}
					}
				}

				if (refs.size === 0)
					this.#listeners.delete(type);
			}
		}
		else {
			super.removeEventListener(type, listener, options);
		}
	}

	/** Remove any listeners added directly to the host. */
	removeAllEventListeners(): void {
		if (!this.#listeners)
			return;

		for (const [ type, refs ] of this.#listeners) {
			for (const ref of refs) {
				const unwrapped = ref.deref();
				try {
					if (unwrapped) {
						const [ , bound, options ] = unwrapped;
						this.removeEventListener(type, bound, options);
					}
				}
				finally {
					refs.delete(ref);
				}
			}

			this.#listeners.delete(type);
		}
	}

}
