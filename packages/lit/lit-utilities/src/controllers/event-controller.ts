import { type Fn } from '@roenlie/core/types';
import { type ReactiveController } from 'lit';
import { nanoid } from 'nanoid';

import { type LitHost } from '../types/lit.js';


export type Target = Window | HTMLElement | null | undefined;


type EventMap = HTMLElementEventMap & WindowEventMap;


type EventList = keyof EventMap;


interface FlexibleHTMLElement extends HTMLElement, Record<string, any> {}


type Listener<R extends EventList = EventList, K extends string = R> = [
	target: FlexibleHTMLElement | Window,
	type: R | K,
	listener: (ev: EventMap[R]) => void,
];


type InitialListener = { [K in Extract<EventList, string>]-?: {
	target: Target | (() => Target | Promise<Target | (() => Target)>) | Promise<Target | (() => Target)>;
	type: K
	listener: (event: EventMap[K]) => any;
	options?: boolean | AddEventListenerOptions;
} }[Extract<EventList, string>];


export class EventController implements ReactiveController {

	public host: LitHost;
	protected listeners = new Map<string, Listener<any, any>>();
	protected listenerRefs = new Map<Fn, string>();
	protected initialListeners?: InitialListener[];

	constructor({ host, listeners }: {
		/**
		 * The host element that connects to this controller.
		 */
		host: LitHost;
		/**
		 * Initial listeners that will be registered on connected lifecycle hook.
		 */
		listeners?: InitialListener[]
	}) {
		this.host = host;
		host.addController(this);
		this.initialListeners = listeners;
	}

	public async hostConnected() {
		await this.host.updateComplete;

		this.initialListeners?.forEach(async ({ target, type, listener, options }) => {
			const t1 = await (typeof target === 'function' ? target() : target);
			const t2 = typeof t1 === 'function' ? t1() : t1;
			t2 && this.addEventListener(t2, type, listener as any, options);
		});
	}

	public hostDisconnected() {
		this.removeAllListeners();
	}

	public hasEventListener = (id: string) => this.listeners.has(id);

	public getEventListener = (id: string) => this.listeners.get(id);

	public addEventListener = <R extends EventList, K extends string = R>(
		target: HTMLElement | Window,
		type: R | K,
		listener: (ev: EventMap[R]) => any,
		options?: boolean | (AddEventListenerOptions & { id?: string }),
	) => {
		const id = (typeof options !== 'boolean' && options?.id) || nanoid(10);

		/* host can be undefined if element is removed before the update complete event actually fires */
		this.host?.updateComplete?.then(_ => {
			const listenerTupl: Listener<R, K> = [ target, type, listener ];

			this.listeners.set(id, listenerTupl);
			this.listenerRefs.set(listener, id);

			target?.addEventListener(type, listener as any, options);
		});

		return id;
	};

	public removeEventListener = (...id: (string | Fn)[]) => {
		const resolvedIds = id.map(id => typeof id === 'function' ? this.listenerRefs.get(id) : id);

		const removeListener = (id: string) => {
			if (!this.listeners.has(id))
				return;

			const [ target, type, listener ] = this.listeners.get(id)!;
			target?.removeEventListener(type, listener);

			this.listeners.delete(id);
			this.listenerRefs.delete(listener);
		};

		resolvedIds.forEach(id => id && removeListener(id));
	};

	public removeAllListeners = () => {
		const listeners = Array.from(this.listeners).map(([ id ]) => id);

		this.removeEventListener(...listeners);
		this.listeners.clear();
		this.listenerRefs.clear();
	};

}
