export const listen = <T extends string>(
	event: T | T[],
	options?: boolean | AddEventListenerOptions,
) => (
	target: HTMLElement & { connectedCallback: () => void; disconnectedCallback: () => void; },
	propertyKey: string,
	descriptor: PropertyDescriptor,
) => {
	const connected = target.connectedCallback;
	const disconnected = target.disconnectedCallback;

	const isString = typeof event === 'string';

	target.connectedCallback = function() {
		connected?.call(this);

		if (isString) {
			this.addEventListener(event, descriptor.value, options);

			return;
		}

		for (const eventName of event)
			this.addEventListener(eventName, descriptor.value, options);
	};

	target.disconnectedCallback = function() {
		disconnected?.call(this);

		if (isString) {
			this.removeEventListener(event, descriptor.value);

			return;
		}

		for (const eventName of event)
			this.removeEventListener(eventName, descriptor.value);
	};
};
