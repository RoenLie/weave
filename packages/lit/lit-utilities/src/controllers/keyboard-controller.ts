import type { Fn } from '@roenlie/core/types';
import type { ReactiveController } from 'lit';

import type { LitHost } from '../types/lit.js';
import { EventController } from './event-controller.js';


type Target = Window | HTMLElement;


type IterableObject<T> = T & Record<string, any>;


export type KeyboardListener<TState extends object> = (ev: KeyboardEvent, key: KeyboardKey<TState>, state: TState) => void;


export type KeyboardEventType = 'keydown' | 'keypress' | 'keyup';


export type KeyboardModifier = 'ctrl' | 'alt' | 'shift';


export interface KeyboardKey<TState extends object> {
	/**
	 * A string value that matches the events code or key property.
	 * This value is automatically uppercased internally to avoid any string compare confusion.
	 */
	key: string | string[];

	/**
	 * The modifier property is an array of arrays of modifiers.
	 *
	 * Each array of modifiers is treated as an OR condition.
	 *
	 * If undefined, all modifier keys are accepted.
	 *
	 * If empty array, no modifier keys are accepted.
	 */
	modifiers?: KeyboardModifier[][];

	/**
	 * A listener function for this exact key combination.
	 */
	listener?: KeyboardListener<TState>;

	/**
	 * Optional target for the event that will be used instead of the host.
	 */
	target?: Target | (() => Target),

	/**
	 *	The keyboard event that the listener will be registrered to.
	 */
	eventType?: KeyboardEventType | KeyboardEventType[];
}


/**
 * Controller that attaches to a LitElement.
 * Automates the connection and disconnection of related keyboard events.
 * Allows the consumer to have keyboard input validated before event is consumed, allowing for less boilerplate code.
 */
export class KeyboardController<
	TState extends Fn<void, object>,
	TRes extends ReturnType<TState>
> implements ReactiveController {

	protected host: LitHost;
	protected keylist: KeyboardKey<TRes>[];
	protected state: TRes;
	protected target: Target | (() => Target);
	protected baseListener?: KeyboardListener<TRes>;
	protected baseListenerId = 'baseListener';
	protected eventType: KeyboardEventType = 'keydown';
	protected eventCtrl: EventController;

	constructor({ host, keylist, state, listener, target, eventType }: {
		/**
		 * The host element that connects to this controller.
		 */
		host: LitHost,
		/**
		 * List of valid key combinations that will trigger the base listener,
		 * and any individual listeners speficific to this combination.
		 */
		keylist?: KeyboardKey<TRes>[],
		/**
		 * Function that returns an object, can be used in keyboard events as a way to track state.
		 */
		state?: TState,
		/**
		 * Listener that will fire on all keys that match the keylist array.
		 */
		listener?: KeyboardListener<TRes>,
		/**
		 * Optional target for the events that will be used instead of the host.
		 */
		target?: Target | (() => Target),
		/**
		 *	The keyboard event that the listeners will be registrered to.
		 */
		eventType?: KeyboardEventType;
	}) {
		(this.host = host).addController(this);
		this.eventCtrl = new EventController({ host });

		this.target = target || host as unknown as Target;
		this.state = (state?.() ?? {}) as TRes;
		this.keylist = keylist ?? [];
		this.baseListener = listener;
		eventType && (this.eventType = eventType);
	}

	public async hostConnected() {
		await this.host.updateComplete;

		/* register the base listener if supplied */
		if (this.baseListener)
			this.addBaseListener(this.baseListener);

		/* add any key spesific listeners */
		this.addKeyListeners(...this.keylist);
	}

	public hostDisconnected() {
		this.eventCtrl.removeAllListeners();
	}

	public addBaseListener(listener: KeyboardListener<TRes>) {
		if (this.eventCtrl.hasEventListener(this.baseListenerId))
			this.eventCtrl.removeEventListener(this.baseListenerId);

		const target = typeof this.target === 'function' ? this.target() : this.target;
		const type = this.eventType;
		const fn = this.enhanceListener(listener, this.keylist, this.state);

		this.eventCtrl.addEventListener(target, type, fn);
	}

	public addKeyListeners(...keys: KeyboardKey<TRes>[]) {
		keys.forEach(k => {
			if (!k.listener)
				return;

			const target = k.target || this.target;
			const resolvedTarget = typeof target === 'function' ? target() : target;
			let types: KeyboardEventType[];
			const fn = this.enhanceListener(k.listener, [ k ], this.state);

			if (Array.isArray(k.eventType))
				types = k.eventType;
			else
				types = [ k.eventType || this.eventType ];

			types.forEach(type => this.eventCtrl.addEventListener(resolvedTarget, type, fn));
		});
	}

	protected enhanceListener = (
		listener: KeyboardListener<TRes>,
		keylist: KeyboardKey<TRes>[],
		state: TRes,
	) => {
		return (ev: KeyboardEvent) => {
			const activeKey = this.validateKey(ev, keylist);
			if (!activeKey)
				return;

			listener?.(ev, activeKey, state);
		};
	};

	protected validateKey(ev: IterableObject<KeyboardEvent>, keylist: KeyboardKey<TRes>[]) {
		const eventKeys = [ ev.code, ev.key ].map(k => k.toUpperCase());

		if (!keylist.length)
			return { key: ev.key };

		const activeKey = keylist.find(k => {
			let keys: string[];
			if (Array.isArray(k.key))
				keys = k.key.map(k => k.toUpperCase());
			else
				keys = [ k.key.toUpperCase() ];

			const correctKey = eventKeys.some(ek => keys.includes(ek));
			const correctModifiers = this.validateModifiers(ev, k.modifiers);

			return correctKey && correctModifiers;
		});

		if (!activeKey)
			return;

		return activeKey;
	}

	protected validateModifiers = (ev: IterableObject<KeyboardEvent>, modifiers?: KeyboardModifier[][]) => {
		if (modifiers === undefined)
			return true;

		if (modifiers.length === 0)
			return !(ev.ctrlKey || ev.altKey || ev.shiftKey);

		return modifiers.some(m => m.every(m => ev[m + 'Key']));
	};

}
