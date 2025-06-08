import { type StaticValue, unsafeStatic } from 'lit-html/static.js';


class ComponentLiteralMap extends Map<string, StaticValue> {

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


export const componentLiteralMap: ComponentLiteralMap = new ComponentLiteralMap();
