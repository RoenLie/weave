export const emit = <T extends string>(name: T, options?: EventInit) => {
	return (
		target: HTMLElement,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => {
		const func = descriptor.value;

		descriptor.value = async function(this: HTMLElement, ...args: any[]) {
			const detail = await func?.call(this, ...args) || {};

			const event = new CustomEvent(
				name, {
					...{
						bubbles:    true,
						cancelable: false,
						composed:   true,
						detail:     {},
					},
					...options,
					detail,
				},
			);

			this.dispatchEvent(event);

			return detail;
		};
	};
};
