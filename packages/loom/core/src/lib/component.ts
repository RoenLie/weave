import { type ResolvablePromise, resolvablePromise } from '@roenlie/core/async';
import { domId, traverseDomUp } from '@roenlie/core/dom';
import { LitElement, type PropertyValues } from 'lit';
import { keyed } from 'lit/directives/keyed.js';

import type { Resolver } from './module.ts';


export class Component extends LitElement {

	static adapter: typeof Adapter;
	static tagName: string;
	static register() {
		if (!this.tagName)
			throw new Error('Must define static tagName property on component');

		if (!customElements.get(this.tagName))
			customElements.define(this.tagName, this);
	}

	static create(resolver: Resolver) {
		this.register();

		const el = document.createElement(this.tagName) as Component;
		el.resolver = resolver;

		return el;
	}

	resolver:                      Resolver;
	protected _moduleConnecting?:  ResolvablePromise;
	protected _adapterConnecting?: ResolvablePromise;
	protected adapter:             Adapter;

	override connectedCallback(): void {
		super.connectedCallback();

		console.log('|connectedCallback|');

		if (!this._moduleConnecting || this._moduleConnecting.done) {
			this._moduleConnecting = resolvablePromise();
			this._adapterConnecting = resolvablePromise();

			this._moduleConnecting.then(() => this.adapterConnectedCallback());
			this.moduleConnectedCallback();
		}
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();

		this._moduleConnecting?.reject();
		this._adapterConnecting?.reject();
	}

	protected override willUpdate(changedProperties: PropertyValues): void {
		super.willUpdate(changedProperties);

		console.log('|willUpdate|');
	}

	protected override update(changedProperties: PropertyValues): void {
		super.update(changedProperties);

		console.log('|update|');
	}

	protected override updated(changedProperties: PropertyValues): void {
		super.updated(changedProperties);

		console.log('|updated|');
	}

	protected override firstUpdated(changedProperties: PropertyValues): void {
		super.firstUpdated(changedProperties);

		console.log('|firstUpdated|');
	}

	async moduleConnectedCallback(): Promise<void> {
		console.log('|moduleConnectedCallback|');

		traverseDomUp(this, (node, stop) => {
			if (!(node instanceof Component))
				return;

			this.resolver = node.resolver;
			stop();
		});

		if (this.resolver === undefined)
			throw new Error('Could not find closest instance of Router');

		this._moduleConnecting?.resolve();
	}

	adapterConnectedCallback() {
		console.log('|adapterConnectedCallback|');

		const adapter = this.resolver.get<typeof Adapter>(this.localName);
		this.adapter = new adapter(this.resolver, this);
		this.renderOptions.host = this.adapter;

		this._adapterConnecting?.resolve();
	}

	protected override scheduleUpdate(): void | Promise<unknown> {
		if (this._adapterConnecting && !this._adapterConnecting.done)
			return this._adapterConnecting.then(() => super.scheduleUpdate()).catch(()=> {});

		return super.scheduleUpdate();
	}

	protected override render(): unknown {
		console.log('|render|');

		return keyed(this.adapter.key, this.adapter.render());
	}

}


export class Adapter {

	constructor(
		public resolver: Resolver,
		public element: Component,
	) {}

	key = domId();

	render(): unknown {
		return;
	}

}
