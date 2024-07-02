/**
 * @example
 * ```ts
 * 	style('height', 'px')
 * 	property({ type: Number })
 *		public height?: number;
 * ```
 *
 * @description
 * A property decorator which makes the property automatically mutate the host style when set.
 *
 * Host style is mutated and not replaced by this action.
 */
export const style = (styleName: string, unit = '', lazy = false) => {
	return (protoOrDescriptor: HTMLElement & Record<string, any>, name: string): any => {
		const { update } = protoOrDescriptor;

		protoOrDescriptor['update'] = function(changedProps: Map<string, any>) {
			if (changedProps.has(name)) {
				const oldValue = changedProps.get(name);
				const newValue = this[ name ];

				if (oldValue !== newValue && (!lazy || this['hasUpdated']))
					this.style.setProperty(styleName, newValue + unit);
			}

			update.call(this, changedProps);
		};
	};
};
