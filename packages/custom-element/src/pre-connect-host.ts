export class PreConnectHost extends HTMLElement {

	/**
	 * Entrypoint for resolving async services or dependencies
	 * before the element renders its content.
	 */
	protected loadRequiredServices(): Promise<void> | void { }

	/**
	 * Native callback whenever the element is connected to the DOM.\
	 * Prefer using `connected` instead, as it is controlled by the class.
	 */
	protected connectedCallback(): void {
		const promise = this.loadRequiredServices();
		if (promise !== undefined)
			promise.then(() => this.connected());
		else
			this.connected();
	}

	/**
	 * Native callback whenever the element is disconnected from the DOM.\
	 * Prefer using `disconnected` instead, as it is controlled by the class.
	 */
	protected disconnectedCallback(): void { this.disconnected(); }

	/**
	 * Called when the element is connected to the DOM.
	 */
	protected connected(): void { }

	/**
	 * Called when the element is disconnected from the DOM.
	 */
	protected disconnected(): void { }

}
