import type { AttributePart, BooleanAttributePart, ChildPart, ElementPart, EventPart, PropertyPart } from 'lit-html';
import { html, render } from 'lit-html';
import type { PartInfo } from 'lit-html/directive.js';
import { Directive, directive, PartType } from 'lit-html/directive.js';

import type { LitPartConstructors } from './runtime-types.js';


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
