import type { RecordOf, stringliteral } from '@roenlie/mimic-core/types';
import type { ReactiveElement } from 'lit';
import { state } from 'lit/decorators.js';


export interface ContextProp<T = any> {value: T;}
export type ConsumeContextEvent<T = any> = CustomEvent<{prop: {value: T;} }>;


export const createEventName = (prop: string | symbol) => 'consume-context:' + prop.toString();
export const createHydrateName = (prop: string | symbol) => 'hydrate-context:' + prop.toString();


export const provide = <T extends any[]>(name: T[number] | stringliteral) => {
	return (target: RecordOf<ReactiveElement>, prop: string) => {
		const connected = target.connectedCallback;
		const disconnected = target.disconnectedCallback;
		const update = target['update'];

		const hydrateName = createHydrateName(name);
		const eventName = createEventName(name);
		const cacheName = '__' + eventName;

		target.connectedCallback = function() {
			const provide = (ev: Event) => {
				ev.preventDefault();
				ev.stopPropagation();
				ev.stopImmediatePropagation();

				// aliasing this to allow the getter and setter to access this from current scope.
				// eslint-disable-next-line @typescript-eslint/no-this-alias
				const me = this;
				const event = ev as ConsumeContextEvent;
				event.detail.prop = {
					get value() {
						return me[prop];
					},
					set value(value: T) {
						me[prop] = value;
					},
				};
			};

			this[cacheName] = provide;
			this.addEventListener(eventName, provide);

			connected.call(this);
		};

		target.disconnectedCallback = function() {
			this.removeEventListener(eventName, this[cacheName]);

			disconnected.call(this);
		};

		target['update'] = function(changedProperties) {
			update.call(this, changedProperties);

			if (changedProperties.has(prop)) {
				const ev = new CustomEvent(hydrateName, { cancelable: false });
				globalThis.dispatchEvent(ev);
			}
		};

		return state()(target, prop);
	};
};


export const consume = <T extends any[]>(name: T[number] | stringliteral) => {
	return (target: RecordOf<ReactiveElement>, prop: string) => {
		const hydrateName = createHydrateName(name);
		const eventName = createEventName(name);
		const cacheName = '__' + hydrateName;

		const connected = target.connectedCallback;
		target.connectedCallback = function() {
			const consume = () => {
				const event = new CustomEvent(eventName, {
					bubbles:    true,
					composed:   true,
					cancelable: false,
					detail:     { prop: undefined },
				});
				this.dispatchEvent(event);

				const property = event.detail.prop;
				if (property !== undefined)
					this[prop] = property;
				else
					console.error('Could not consume ' + name);
			};

			consume();

			this[cacheName] = consume;
			globalThis.addEventListener(hydrateName, consume);

			connected.call(this);
		};

		const disconnected = target.disconnectedCallback;
		target.disconnectedCallback = function() {
			globalThis.removeEventListener(hydrateName, this[cacheName]);

			disconnected.call(this);
		};

		return state()(target, prop);
	};
};
