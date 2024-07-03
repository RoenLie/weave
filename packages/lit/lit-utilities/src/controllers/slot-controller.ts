import type { ComputedFlat, stringliteral } from '@roenlie/core/types';
import { LitElement, type ReactiveController, type ReactiveControllerHost } from 'lit';


/**
 * Creates an object with the provided list of `TKeys` where each value is a `TVal`
 *
 * If the list of `TKeys` is empty a record of `TVal` is created instead.
 */
export type ObjectOfKeys<TKeys extends readonly string[], TVal = any> = TKeys extends []
	? Record<string, TVal>
	: ComputedFlat<Record<TKeys[number], TVal>>;


export type SlotListener = (slotName: string, slot: HTMLSlotElement) => void;

export class SlotController<T extends string> implements ReactiveController {

	protected host: ReactiveControllerHost & Element;
	protected slotNames: string[] = [];
	protected listener?: SlotListener;

	constructor(options: { host: ReactiveControllerHost & Element, slotNames?: T[], listener?: SlotListener }) {
		const { host, slotNames, listener } = options;
		(this.host = host).addController(this);
		this.slotNames = slotNames ?? [];
		this.listener = listener;
		this.handleSlotChange = this.handleSlotChange.bind(this);
	}

	private hasDefaultSlot() {
		return [ ...this.host.childNodes ].some(node => {
			if (node.nodeType === node.TEXT_NODE && node.textContent!.trim() !== '')
				return true;

			if (node.nodeType === node.ELEMENT_NODE) {
				const el = node as HTMLElement;
				const tagName = el.tagName.toLowerCase();

				// Ignore visually hidden elements since they aren't rendered
				if (tagName.includes('visually-hidden'))
					return false;

				// If it doesn't have a slot attribute, it's part of the default slot
				if (!el.hasAttribute('slot'))
					return true;
			}

			return false;
		});
	}

	private hasNamedSlot(name: string) {
		return this.host.querySelector(`:scope > [slot="${ name }"]`) !== null;
	}

	public test(slotName: T | '[default]' | stringliteral) {
		return slotName === '[default]' ? this.hasDefaultSlot() : this.hasNamedSlot(slotName);
	}

	public testMany<TNames extends readonly(T | '[default]')[]>(...slotNames: TNames | stringliteral[]): ObjectOfKeys<TNames, boolean> {
		const result: Record<string, boolean> = {};

		for (const slotName of slotNames)
			result[slotName] = this.test(slotName);

		return result as ObjectOfKeys<TNames, boolean>;
	}

	public hostConnected() {
		this.host.shadowRoot?.addEventListener('slotchange', this.handleSlotChange);
	}

	public hostDisconnected() {
		this.host.shadowRoot?.removeEventListener('slotchange', this.handleSlotChange);
	}

	public handleSlotChange(event: Event) {
		const slot = event.target as HTMLSlotElement;

		this.listener?.(slot.name, slot);

		if ((this.slotNames.includes('[default]') && !slot.name) || (slot.name && this.slotNames.includes(slot.name)))
			this.host.requestUpdate();
	}

}

/**
 * Given a slot, this function iterates over all of its assigned element and text nodes and returns the concatenated
 * HTML as a string. This is useful because we can't use slot.innerHTML as an alternative.
 */
export const getInnerHTML = (slot: HTMLSlotElement): string => {
	const nodes = slot.assignedNodes({ flatten: true });
	let html = '';

	[ ...nodes ].forEach(node => {
		if (node.nodeType === Node.ELEMENT_NODE)
			html += (node as HTMLElement).outerHTML;


		if (node.nodeType === Node.TEXT_NODE)
			html += node.textContent;
	});

	return html;
};


/**
 * Given a slot, this function iterates over all of its assigned text nodes and returns the concatenated text as a
 * string. This is useful because we can't use slot.textContent as an alternative.
 */
export const getTextContent = (slot: HTMLSlotElement | undefined | null): string => {
	if (!slot)
		return '';

	const nodes = slot.assignedNodes({ flatten: true });
	let text = '';

	[ ...nodes ].forEach(node => {
		if (node.nodeType === Node.TEXT_NODE)
			text += node.textContent;
	});

	return text;
};


class Tester extends LitElement {

	protected readonly slotCtrl = new SlotController({
		host:      this,
		slotNames: [ 'test', 'test2' ],
	});

	public override connectedCallback(): void {
		super.connectedCallback();

		const result = this.slotCtrl.testMany('[default]', 'test');

		result.test;
	}

}
