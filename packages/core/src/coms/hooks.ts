import { nanoid } from 'nanoid';

import { lazyMap } from '../structs/lazy-map.js';
import { MirrorMap } from '../structs/mirror-map.js';
import type { Fn } from '../types/function.types.js';


type Handlers = MirrorMap<string, Fn>;


/**
 * Provide hooks for the `TEvents`; a type-map of events to handlers.
 *
 * Knows how to track handlers for different events and
 * allow the consumer to trigger that event, causing each handler to run.
 */
export class Hooks<TEvents extends Record<string, Fn>> {

	private _handlers: Map<keyof TEvents, Handlers> = new Map();

	/**
	 * Add the `handler` to the `event`.
	 * @returns An ID which can be passed to remove in lieu of passing the handler itself.
	 */
	add<TEvent extends keyof TEvents>(event: TEvent, handler: TEvents[TEvent]): string {
		const key = nanoid(6);

		this.handlersFor(event).set(key, handler);

		return key;
	}

	/** Add a handler from the `event` by either providing it or its ID (returned from this.Add). */
	remove<TEvent extends keyof TEvents>(
		event: TEvent,
		handlerOrId: TEvents[TEvent] | string,
	): void {
		const handlers = this.handlersFor(event);

		if (typeof handlerOrId === 'string')
			handlers.delete(handlerOrId);
		else
			handlers.deleteByValue(handlerOrId);
	}

	/** Trigger the `event`, by running each of its handlers on the provided `args`. */
	trigger<TEvent extends keyof TEvents>(
		event: TEvent, ...args: Parameters<TEvents[TEvent]>
	): ReturnType<TEvents[TEvent]>[] {
		return [ ...this.handlersFor(event).values() ].map(fn => fn(...args));
	}

	/** Lazy-initialize the ReflectMap for the `event`. */
	protected handlersFor<TEvent extends keyof TEvents>(event: TEvent): Handlers {
		return lazyMap(this._handlers, event, () => new MirrorMap<string, Fn>);
	}

}
