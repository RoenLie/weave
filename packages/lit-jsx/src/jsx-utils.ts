import type { AttributePart, BooleanAttributePart, ChildPart, ElementPart, EventPart, PropertyPart } from 'lit-html';
import { html, render } from 'lit-html';
import type { PartInfo } from 'lit-html/directive.js';
import { Directive, directive, PartType } from 'lit-html/directive.js';

import type { LitPartConstructors } from './runtime-types.js';


type IfEquals<X, Y, A = X> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? A : never;

type WritableKeys<T> = {
	[P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P>
}[keyof T];

type TrimReadonly<T> = Pick<T, WritableKeys<T>>;

type ExcludeHTML<T extends HTMLElement> = TrimReadonly<Omit<T, keyof HTMLElement | 'constructor'>>;


export type JSXProps<T extends HTMLElement> = Partial<ExcludeHTML<T>>
	& JSX.HTMLAttributes<T>
	& {};


/**
 * Creates a variable which can be used using the Component syntax in JSX.\
 * Also registers the custom element if it hasn't been registered yet.
 *
 * @example
 * ```tsx
 * import { toJSX } from '@roenlie/lit-jsx';
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
): (props: JSXProps<InstanceType<T>>) => string => {
	if ('register' in element && typeof element.register === 'function')
		element.register();
	else if (!customElements.get(element.tagName))
		customElements.define(element.tagName, element);

	return element.tagName as any;
};


export const __ttl: (strings: TemplateStringsArray) => TemplateStringsArray = s => s;


export const getLitParts: () => LitPartConstructors = (() => {
	let hasRun = false;

	const constructors = {
		AttributePart: undefined,
		PropertyPart:  undefined,
		BooleanPart:   undefined,
		EventPart:     undefined,
		ChildPart:     undefined,
		ElementPart:   undefined,
	} satisfies Record<keyof LitPartConstructors, undefined> as
		any as LitPartConstructors;

	const partCtorGrabber: any = directive(class PartCtorGrabber extends Directive {

		constructor(part: PartInfo) {
			super(part);

			if (part.type === PartType.BOOLEAN_ATTRIBUTE)
				constructors.BooleanPart = part.constructor as typeof BooleanAttributePart;
			else if (part.type === PartType.ATTRIBUTE)
				constructors.AttributePart = part.constructor as typeof AttributePart;
			else if (part.type === PartType.PROPERTY)
				constructors.PropertyPart = part.constructor as typeof PropertyPart;
			else if (part.type === PartType.ELEMENT)
				constructors.ElementPart = part.constructor as typeof ElementPart;
			else if (part.type === PartType.EVENT)
				constructors.EventPart = part.constructor as typeof EventPart;
			else if (part.type === PartType.CHILD)
				constructors.ChildPart = part.constructor as typeof ChildPart;
		}

		override render(): void {}

	});

	return () => {
		if (!hasRun) {
			const g = partCtorGrabber;
			hasRun = !!render(
				html`<div ${ g() } prop=${ g() } .prop=${ g() } ?prop=${ g() } @prop=${ g() }>${ g() }</div>`,
				document.createElement('div'),
			);
		}

		return constructors;
	};
})();
