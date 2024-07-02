export class DynamicStyle {

	protected static poolSize = 10;
	protected static readonly pool: Map<any, any>[] = [];

	protected readonly styles = new Map<string, Map<string, string | number>>;
	protected activeSelector = '';

	public selector(name: string) {
		this.activeSelector = name;

		return this.combined;
	}

	protected _selector = (selector: string) => {
		this.activeSelector += ',\n' + selector;

		return this.combined;
	};

	protected _property = (key: string, value: string | number) => {
		if (!this.styles.has(this.activeSelector)) {
			const map = DynamicStyle.pool.pop() ?? new Map();
			this.styles.set(this.activeSelector, map);
		}

		this.styles.get(this.activeSelector)?.set(key, value);

		return this.propSetter;
	};

	protected propSetter = { property: this._property };
	protected combined = { selector: this._selector, property: this._property };


	public clear() {
		// We remove each map, clear it and add it to the pool of available maps.
		for (const [ key, map ] of this.styles) {
			this.styles.delete(key);
			map.clear();
			if (DynamicStyle.pool.length < DynamicStyle.poolSize)
				DynamicStyle.pool.push(map);
		}
	}

	public toString() {
		let str = '';

		for (const [ selector, props ] of this.styles) {
			str += selector + '{\n';

			// eslint-disable-next-line prefer-const
			for (let [ key, value ] of props) {
				if (!value)
					continue;

				// Convert property names from camel-case to dash-case, i.e.:
				//  `backgroundColor` -> `background-color`
				// Vendor-prefixed names need an extra `-` appended to front:
				//  `webkitAppearance` -> `-webkit-appearance`
				// Exception is any property name containing a dash, including
				// custom properties; we assume these are already dash-cased i.e.:
				//  `--my-button-color` --> `--my-button-color`
				key = key.includes('-') ? key
					: key.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, '-$&').toLowerCase();

				str += '\t' + key + ':' + value + ';\n';
			}

			str += '}\n';
		}

		return str;
	}

}
