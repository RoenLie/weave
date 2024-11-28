import type { CSSResultGroup, PropertyValues } from 'lit';

import { injectable } from '../annotations/annotations.js';
import { type Container } from '../container/container.js';
import { ContainerFacility } from '../container/loader.js';
import { type AegisComponent, currentAdapterElement } from '../element/aegis-component.js';
import { useReflectMetadata } from '@roenlie/reflect-metadata';


export class Adapter<T extends object = Record<keyof any, any>> {

	static { useReflectMetadata(); injectable()(this); }

	public element: AegisComponent & T;

	/** {@link AegisComponent.shadowRoot} */
	public get shadowRoot(): ShadowRoot {
		return this.element.shadowRoot!;
	}

	/** {@link AegisComponent.container} */
	protected get container(): Container {
		return ContainerFacility.container;
	}

	/** {@link AegisComponent.updateComplete} */
	protected get updateComplete(): Promise<boolean> {
		return this.element.updateComplete;
	}

	constructor() {
		if (currentAdapterElement)
			this.element = currentAdapterElement as AegisComponent & T;
		else
			throw new Error('No element could be resolved.');
	}

	/** {@link AegisComponent.requestUpdate} */
	public requestUpdate(...args: Parameters<AegisComponent['requestUpdate']>) {
		this.element.requestUpdate(...args);
	}

	/** {@link AegisComponent.performUpdate} */
	public performUpdate(...args: Parameters<AegisComponent['performUpdate']>) {
		(this.element as any).performUpdate(...args);
	}

	/** {@link AegisComponent.querySelector} */
	public querySelector<T extends HTMLElement>(...args: Parameters<DocumentFragment['querySelector']>) {
		return (this.element.shadowRoot?.querySelector(...args) ?? undefined) as T | undefined;
	}

	/** {@link AegisComponent.querySelectorAll} */
	public querySelectorAll<T extends HTMLElement>(...args: Parameters<DocumentFragment['querySelectorAll']>) {
		return (this.element.shadowRoot
			?.querySelectorAll(...args) ?? undefined) as NodeListOf<T> | undefined;
	}

	/** {@link AegisComponent.getElementById} */
	public getElementById<T extends HTMLElement>(...args: Parameters<DocumentFragment['getElementById']>) {
		return (this.element.shadowRoot?.getElementById(...args) ?? undefined) as T | undefined;
	}

	/** {@link AegisComponent.connectedCallback} */
	public connectedCallback?(): void;

	/** {@link AegisComponent.afterConnectedCallback} */
	public afterConnectedCallback?(): void;

	/** {@link AegisComponent.disconnectedCallback} */
	public disconnectedCallback?(): void;

	/** {@link AegisComponent.firstUpdated} */
	public firstUpdated?(changedProps: PropertyValues): void;

	/** {@link AegisComponent.willUpdate} */
	public willUpdate?(changedProps: PropertyValues): void;

	/** {@link AegisComponent.update} */
	public update?(changedProps: PropertyValues): void;

	/** {@link AegisComponent.updated} */
	public updated?(changedProps: PropertyValues): void;

	/** {@link AegisComponent.render} */
	public render?(): unknown;

	/** {@link AegisComponent.styles} */
	public static styles?: CSSResultGroup;

}
