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
 * Creates a variable which can be used using the Component syntax in JSX.
 * Also registers the custom element if it hasn't been registered yet.
 *
 * @example
 * ```tsx
 * import { toJSX } from 'jsx-lit';
 *
 * export class MyButton extends LitElement {
 *   static tagName = 'my-button';
 *   static tag = toJSX(MyButton);
 *
 *   render() {
 *     return html`<button><slot></slot></button>`;
 *   }
 * }
 *
 * // Usage in JSX
 * const jsx = (
 *   <MyButton.tag
 *     class="my-button"
 *     on-click={() => { console.log('Clicked!'); }}
 *   />
 * );
 * ```
 */
export const toJSX = <T extends { new(...args: any): any; tagName: string; }>(
	element: T,
): (props: JSX.JSXProps<InstanceType<T>>) => string => {
	queueMicrotask(() => {
		if ('register' in element && typeof element.register === 'function')
			element.register();
		else if (!customElements.get(element.tagName))
			customElements.define(element.tagName, element);
	});

	return element.tagName as any;
};


/**
 * Creates a dynamic tag name object that can be used with jsx-lit's Component syntax.
 * This function is required for dynamic tag names to compile to static literals.
 *
 * **IMPORTANT**: Dynamic tag names must use the `.tag` property pattern to be properly
 * compiled to lit-html static templates. Without this pattern, jsx-lit cannot detect
 * and transform the dynamic tag name into efficient static template literals.
 *
 * @example
 * ```tsx
 * import { toTag } from 'jsx-lit';
 *
 * // ✅ Correct usage - creates { tag: 'div' } object
 * const DynamicDiv = toTag('div');
 * const DynamicCustomElement = toTag('my-custom-element');
 *
 * // Usage in JSX with .tag property (required for compilation)
 * function renderConditional({ useDiv }) {
 *   const Tag = toTag(useDiv ? 'div' : 'span');
 *   return <Tag.tag class="dynamic">Content</Tag.tag>;
 * }
 *
 * // Compiles to efficient static templates:
 * // const Tag = toTag(useDiv ? 'div' : 'span');
 * // const __$Tag = __$literalMap.get(Tag.tag);
 * // htmlStatic`<${__$Tag} class="dynamic">Content</${__$Tag}>`
 * ```
 *
 * @example
 * ```tsx
 * // ❌ Incorrect usage - won't compile to static templates
 * const badTag = 'div';
 * return <badTag>Content</badTag>; // This won't work with jsx-lit
 *
 * // ❌ Incorrect usage - missing .tag property
 * const BadTag = toTag('div');
 * return <BadTag>Content</BadTag>; // Won't compile correctly
 *
 * // ✅ Correct usage - with .tag property
 * const GoodTag = toTag('div');
 * return <GoodTag.tag>Content</GoodTag.tag>; // Compiles to static templates
 * ```
 *
 * @param tag - The HTML tag name (standard HTML elements or custom element names)
 * @returns An object with a `tag` property containing the tag name, designed for use with jsx-lit's Component syntax
 */
export const toTag = <T extends keyof HTMLElementTagNameMap | (string & {})>(
	tag: T,
): { tag: T; } => {
	return { tag } as any;
};
