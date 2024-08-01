import type { CSSResultGroup, CSSResultOrNative, PropertyValues } from 'lit';

import { type AppComponent, currentAdapterElement } from '../elements/app-component.ts';
import { getBase } from '../utilities/get-base.ts';
import { injectable, PluginContainer } from './plugin.ts';


@injectable()
export class Adapter<T extends object = Record<keyof any, any>> {

	public element: AppComponent & T;

	/** {@link AppComponent.shadowRoot} */
	public get shadowRoot(): ShadowRoot { return this.element.shadowRoot!; }

	/** {@link AppComponent.plugins} */
	protected get plugins(): PluginContainer { return this.element.plugins; }

	/** {@link AppComponent.updateComplete} */
	protected get updateComplete(): Promise<boolean> { return this.element.updateComplete; }

	constructor(element?: AppComponent & T) {
		this.element = element ? element : currentAdapterElement as AppComponent & T;
		if (!this.element) {
			throw new Error('No element could be resolved, '
				+ 'make sure that if the adapter is bound through a container '
				+ 'returns the constructor and not the instance.');
		}

		const elementBase = getBase<typeof AppComponent>(this.element);
		const adapterBase = getBase<typeof Adapter>(this);

		adapterBase.adapterStyles = (elementBase as any)
			.finalizeStyles(adapterBase.styles);
	}

	/** {@link AppComponent.requestUpdate} */
	public requestUpdate(...args: Parameters<AppComponent['requestUpdate']>) {
		this.element.requestUpdate(...args);
	}

	/** {@link AppComponent.performUpdate} */
	public performUpdate(...args: Parameters<AppComponent['performUpdate']>) {
		(this.element as any).performUpdate(...args);
	}

	/** {@link DocumentFragment.querySelector} */
	public querySelector<T extends HTMLElement>(...args: Parameters<DocumentFragment['querySelector']>) {
		return (this.element.shadowRoot?.querySelector(...args) ?? undefined) as T | undefined;
	}

	/** {@link DocumentFragment.querySelectorAll} */
	public querySelectorAll<T extends HTMLElement>(...args: Parameters<DocumentFragment['querySelectorAll']>) {
		return (this.element.shadowRoot?.querySelectorAll(...args) ?? undefined) as
			NodeListOf<T> | undefined;
	}

	/** {@link DocumentFragment.getElementById} */
	public getElementById<T extends HTMLElement>(...args: Parameters<DocumentFragment['getElementById']>) {
		return (this.element.shadowRoot?.getElementById(...args) ?? undefined) as T | undefined;
	}

	/** {@link AppComponent.connectedCallback} */
	public connectedCallback?(): void;

	/** {@link AppComponent.afterConnectedCallback} */
	public afterConnectedCallback?(): void;

	/** {@link AppComponent.disconnectedCallback} */
	public disconnectedCallback?(): void;

	/** {@link AppComponent.afterDisconnectedCallback} */
	public afterDisconnectedCallback?(): void;

	/**
	 * Runs when the adapter is replaced by a new instance on the host element.
	 * Can be used for any cleanup operations required when this instance will no longer be used.
	*/
	public dispose?(): void;

	/** {@link AppComponent.firstUpdated} */
	public firstUpdated?(changedProps: PropertyValues): void;

	/** {@link AppComponent.willUpdate} */
	public willUpdate?(changedProps: PropertyValues): void;

	/** {@link AppComponent.update} */
	public update?(changedProps: PropertyValues): void;

	/** {@link AppComponent.updated} */
	public updated?(changedProps: PropertyValues): void;

	/** {@link AppComponent.render} */
	public render?(): unknown;

	/** {@link AppComponent.styles} */
	public static styles?: CSSResultGroup;

	/** Memoized list of all adapter styles. */
	public static adapterStyles: CSSResultOrNative[];

}
