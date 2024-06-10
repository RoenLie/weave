export {};


declare global {

	interface AddEventListenerOptions {
		/**
		 * Only for custom elements.
		 *
		 * Hooks any events added this way into the HTMLElements disconnectedCallback.
		 *
		 * Automatically removes the event upon disconnectedCallback lifecycle.
		 */
		autoDispose?: boolean;
	}
}

interface DisposableHTMLElement extends HTMLElement {
	disconnectedCallback?: Function;
	__autoDisposeEvents?:  boolean;
	__eventsToDispose:     Map<string, Set<EventListenerOrEventListenerObject>>;
}


const originalAddEventListener = HTMLElement.prototype.addEventListener;
HTMLElement.prototype.addEventListener = function(
	this: DisposableHTMLElement,
	type: string,
	listener: EventListenerOrEventListenerObject,
	options: AddEventListenerOptions,
) {
	// If this is not a custom element, default to normal behavior.
	if (!customElements.get(this.localName))
		return originalAddEventListener.call(this, type, listener, options);

	// perform the default listener logic.
	originalAddEventListener.call(this, type, listener, options);

	// make sure the disposalMap exists
	this.__eventsToDispose ??= new Map();

	// Add the listener to the set for this event type.
	(this.__eventsToDispose.get(type) ??
		this.__eventsToDispose.set(type, new Set()).get(type)!).add(listener);

	// If disconnection logic has already been created, ignore this.
	if (this.__autoDisposeEvents)
		return;

	this.__autoDisposeEvents = true;

	// Shim this elements disconnectedCallback to also include the removal of events.
	const originalDisconnectedCallback = this.disconnectedCallback;
	this.disconnectedCallback = function(...args: any) {
		originalDisconnectedCallback?.call(this, ...args);

		this.__eventsToDispose.forEach((listeners, type) => {
			listeners.forEach(listener => this.removeEventListener(type, listener));
		});

		this.__eventsToDispose.clear();
	};
};


const originalRemoveEventListener = HTMLElement.prototype.removeEventListener;
HTMLElement.prototype.removeEventListener = function(
	this: DisposableHTMLElement,
	type: string,
	listener: EventListenerOrEventListenerObject,
	options?: boolean | EventListenerOptions,
) {
	if (!customElements.get(this.localName))
		return originalRemoveEventListener.call(this, type, listener, options);

	// perform the default listener logic.
	originalRemoveEventListener.call(this, type, listener, options);

	// make sure the disposalMap exists
	this.__eventsToDispose ??= new Map();


	// Remove this listener from the ones being removed upon disconnect.
	(this.__eventsToDispose.get(type) ??
		this.__eventsToDispose.set(type, new Set()).get(type)!).delete(listener);
};
