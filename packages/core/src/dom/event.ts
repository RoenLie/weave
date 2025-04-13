type EventMap = HTMLElementEventMap;
type EventList = keyof EventMap;


/**
 * `Event` with a strongly typed `target` known to exist.
 */
export interface EventOf<TEl extends HTMLElement = HTMLElement> extends Event {
	target:        TEl;
	currentTarget: TEl;
}

/**
 * `CustomEvent<T>` with a strongly typed `target` known to exist.
 */
export interface CustomEventOf<T, TEl extends HTMLElement = HTMLElement> extends CustomEvent<T> {
	target:        TEl;
	currentTarget: TEl;
}


/**
 * Emits a custom event with more convenient defaults.
 *
 * Gets type information from the global type {@link HTMLElementEventMap}
 */
export const emitEvent = <T extends EventMap, R extends EventList, K extends string = R>(
	el: HTMLElement,
	name: R | K,
	options?: T[R] extends CustomEvent ? CustomEventInit<T[R]['detail']> : CustomEventInit,
): CustomEvent<T[R] extends CustomEvent ? T[R]['detail'] : any> => {
	const event = new CustomEvent(
		name,
		{
			bubbles:    true,
			cancelable: false,
			composed:   true,
			detail:     {},
			...options,
		},
	);

	el.dispatchEvent(event);

	return event;
};


type EventType<T extends EventMap, R extends EventList> =
	T[R] extends CustomEvent ? CustomEvent<T[R]['detail']> : T[R];

type EventReturnType<T extends EventMap, R extends EventList> =
	T[R] extends CustomEvent ? T[R]['detail'] | undefined : undefined;


/**
 * Waits for a specific event to be emitted from an element.
 *
 * Ignores events that bubble up from child elements.
 *
 * Gets type information from the global type {@link HTMLElementEventMap}
 */
export const waitForEvent = <T extends EventMap, R extends EventList, K extends string = R>(
	el: Window | HTMLElement,
	eventName: R | K,
	options?: {
		bubbles?:  boolean;
		/** Predicate that can be used to terminate the waiting state. */
		continue?: (ev: T[R] extends CustomEvent ? CustomEvent<T[R]['detail']> : T[R]) => boolean;
	},
): Promise<EventReturnType<T, R>> => {
	return new Promise<EventReturnType<T, R>>(resolve => {
		const end = (details: EventReturnType<T, R>) => {
			el.removeEventListener(eventName, done as any);
			resolve(details);
		};

		const done = (event: EventType<T, R>) => {
			if (options?.bubbles) {
				if (event.currentTarget === window)
					end(undefined);

				if (options?.continue?.(event) ?? true)
					end(undefined);
			}
			else {
				if (event.target === el) {
					if (options?.continue?.(event) ?? true) {
						if (event instanceof CustomEvent)
							end(event.detail);
						else
							end(undefined);
					}
				}
			}
		};

		el.addEventListener(eventName, done as any);
	});
};


/**
 * Prevents default and stops propagation.
 *
 * @param immediate - By default all propagation is stopped.
 * Pass `false` if you don't want to stop immediate propagation.
 */
export const setEventHandled = (e: Event, immediate = true): void => {
	e.preventDefault();
	e.stopPropagation();

	if (immediate)
		e.stopImmediatePropagation();
};
