import type { ElementPart } from 'lit-html';
import { noChange } from 'lit-html';
import type { DirectiveParameters, DirectiveResult, PartInfo } from 'lit-html/directive.js';
import { Directive, directive, PartType } from 'lit-html/directive.js';
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


class RestDirective extends Directive {

	constructor(part: PartInfo) {
		super(part);

		if (part.type !== PartType.ELEMENT)
			throw new Error('RestDirective can only be used on ElementParts');
	}

	override update(part: ElementPart, [ rest ]: DirectiveParameters<this>): unknown {
		const element = part.element as HTMLElement & Record<string, any>;

		for (const key in rest) {
			if (!Object.prototype.hasOwnProperty.call(rest, key))
				continue;

			const value = rest[key]!;

			if (element[key] === value)
				continue;

			if (typeof value === 'object')
				element[key] = value;
			else if (value === null || value === undefined)
				element.removeAttribute(key);
			else
				element.setAttribute(key, String(value));
		}

		return noChange;
	}

	override render(rest: Record<keyof any, any>): unknown {
		console.log('rest parameter stuff', rest);

		return noChange;
	}

}


export const __$rest: DirectiveResult<typeof RestDirective> = directive(RestDirective);


/**
 * Creates a variable which can be used using the Component syntax in JSX.\
 * Also registers the custom element if it hasn't been registered yet.
 *
 * @example
 * ```tsx
 * import { toJSX } from 'jsx-lit';
 *
 * const MyButton = toJSX(MyButtonCmp);
 * const jsx = (
 *  <MyButton
 *   class="my-button"
 *   on-click={() => { console.log('Clicked!'); }}
 *  />
 * ```
 */
export const toJSX = <T extends { new(...args: any): any; tagName: string; }>(
	element: T,
): (props: JSX.JSXProps<InstanceType<T>>) => string => {
	if ('register' in element && typeof element.register === 'function')
		element.register();
	else if (!customElements.get(element.tagName))
		customElements.define(element.tagName, element);

	return element.tagName as any;
};
