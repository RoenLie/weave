import { findActiveElement } from './elements.js';
import { getTabbableBoundary } from './tabbable.js';


let activeModals: HTMLElement[] = [];


export class Modal {

	element:      HTMLElement;
	tabDirection: 'forward' | 'backward' = 'forward';
	protected trapFocus = false;

	constructor(element: HTMLElement) {
		this.element = element;
		this.handleFocusIn = this.handleFocusIn.bind(this);
		this.handleFocusOut = this.handleFocusOut.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);

		this.handleFocusIn();
	}

	activate(): void {
		activeModals.push(this.element);
		document.addEventListener('focusin', this.handleFocusIn);
		document.addEventListener('focusout', this.handleFocusOut);
		document.addEventListener('keydown', this.handleKeyDown);
	}

	deactivate(): void {
		activeModals = activeModals.filter(modal => modal !== this.element);
		document.removeEventListener('focusin', this.handleFocusIn);
		document.removeEventListener('focusout', this.handleFocusOut);
		document.removeEventListener('keydown', this.handleKeyDown);
	}

	isActive(): boolean {
		// The "active" modal is always the most recent one shown
		return activeModals[activeModals.length - 1] === this.element;
	}

	checkFocus(event: KeyboardEvent): void {
		if (!this.isActive() || !this.trapFocus)
			return;

		const boundry = getTabbableBoundary(this.element);

		// If we cannot find a boundry, it means there are no tabbable elements.
		// This is a wierd edge case, but we should stop focus from escaping in this situation.
		if (!boundry.start && !boundry.end)
			return event.preventDefault();

		const currentActive = findActiveElement(this.element, false);

		const direction = this.tabDirection;
		if (direction === 'backward' && (currentActive === boundry.start)) {
			event.preventDefault();
			boundry.end?.focus();
		}
		if (direction === 'forward' && currentActive === boundry.end) {
			event.preventDefault();
			boundry.start?.focus();
		}
	}

	handleFocusIn(): void {
		this.trapFocus = true;
	}

	handleFocusOut(): void {
		this.trapFocus = false;
	}

	handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Tab') {
			if (event.shiftKey)
				this.tabDirection = 'backward';
			else
				this.tabDirection = 'forward';

			this.checkFocus(event);
		}
	}

	handleKeyUp(): void {
		this.tabDirection = 'forward';
	}

}
