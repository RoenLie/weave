import type { StaticValue } from 'lit-html/static.js';
import { unsafeStatic } from 'lit-html/static.js';


class LiteralMap extends Map<string, StaticValue> {

	override get(key: string): StaticValue {
		const value = super.get(key);
		if (value === undefined) {
			const literal = unsafeStatic(key);
			this.set(key, literal);

			return literal;
		}

		return value;
	}

}


export const __$literalMap: LiteralMap = new LiteralMap();
