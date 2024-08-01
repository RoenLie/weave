import { type EventPart, html, render } from 'lit';

import { AppComponent } from '../elements/app-component.ts';


interface LitPartElement extends HTMLElement {
	_$litPart$: any;
}


/*
 We render the a lit template with a listener binding into the created element.
 We don't need to actually place the element into the dom, lit still performs
 the initialization logic that we are interested in.
*/
const shimHtml = html`<div @click=${ () => {} }></div>`;
const placeholder = document.createElement('div') as unknown as LitPartElement;
render(shimHtml, placeholder);


/*
 We extract the EventPart class from the parent of the element rendered through the lit system
 as lit does not export the actual EventPart class.
*/
const [ commitedValueKey, EventPartRef ] = Object
	.entries(placeholder._$litPart$)
	.reduce((acc, [ pKey, value ]) => {
		if (value && typeof value === 'object' && pKey.startsWith('_$')) {
			Object.entries(value).forEach(([ cKey, value ]) => {
				if (cKey.startsWith('_$') && Array.isArray(value)) {
					const eventPart = value.find(part => part.type === 5) as EventPart | undefined;
					if (eventPart) {
						acc[0] = pKey;
						acc[1] = Object.getPrototypeOf(eventPart);
					}
				}
			});
		}

		return acc;
	}, [ undefined, undefined ] as [commitedValueKey: undefined | string, EventPart: undefined | EventPart]);


if (!EventPartRef || !commitedValueKey)
	throw new Error('Failed to find the EventPart class from the lit system.');


/*
 Shims the default Lit HTML event handling to try and call any event bound using
 the adapter instead of the host element.
 This allows for the adapter to handle the event instead of the host element.
*/
const original = EventPartRef.handleEvent;
EventPartRef.handleEvent = function(this: EventPart & Record<keyof any, any>, event: Event) {
	if (this.options?.host instanceof AppComponent) {
		if (typeof this[commitedValueKey]! === 'function')
			this[commitedValueKey].call(this.options?.host?.adapter ?? this.options?.host ?? this.element, event);
		else
			this[commitedValueKey].handleEvent(event);
	}
	else {
		original.call(this, event);
	}
};
