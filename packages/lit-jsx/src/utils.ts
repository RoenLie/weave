import { noChange } from 'lit-html';
import { Directive, directive, type DirectiveResult } from 'lit-html/directive.js';
import { type StaticValue, unsafeStatic } from 'lit-html/static.js';


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


class RestDirective extends Directive {

	override render(...props: unknown[]): unknown {
		console.log('rest parameter stuff', props);

		return noChange;
	}

}


export const __$rest: DirectiveResult<typeof RestDirective> = directive(RestDirective);
