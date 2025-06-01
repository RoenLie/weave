import type { stringliteral } from '@roenlie/core/types';

import type { ReactiveController } from '../shared/reactive-controller.ts';
import type { AdapterElement } from './adapter-element.ts';


export class SlotController<const T extends string[] = ['[default]']> implements
	ReactiveController {

	constructor(
		protected host: AdapterElement,
		protected slotNames: T = [] as any as T,
	) {
		host.addController(this);
	}

	hostConnected(): void {
		this.host.element.renderRoot.addEventListener('slotchange', this.handleSlotChange);
	}

	hostDisconnected(): void {
		this.host.element.renderRoot.removeEventListener('slotchange', this.handleSlotChange);
	}

	test(slotName: '[default]' | T[number] | stringliteral): boolean {
		return slotName === '[default]' ? this.hasDefaultSlot() : this.hasNamedSlot(slotName);
	}

	protected hasDefaultSlot(): boolean {
		return [ ...this.host.element.childNodes ].some(node => {
			if (node.nodeType === node.TEXT_NODE && node.textContent!.trim() !== '')
				return true;

			if (node.nodeType === node.ELEMENT_NODE) {
				const el = node as HTMLElement;

				// If it doesn't have a slot attribute, it's part of the default slot
				if (!el.hasAttribute('slot'))
					return true;
			}

			return false;
		});
	}

	protected hasNamedSlot(name: string): boolean {
		return this.host.querySelector(`:scope > [slot="${ name }"]`) !== null;
	}

	protected handleSlotChange = (event: Event): void => {
		const slot = event.target as HTMLSlotElement;

		const isDefaultSlot = this.slotNames.includes('[default]') && !slot.name;
		const isNamedSlot = slot.name && this.slotNames.includes(slot.name);

		if (isDefaultSlot || isNamedSlot)
			this.host.requestUpdate();
	};

}
