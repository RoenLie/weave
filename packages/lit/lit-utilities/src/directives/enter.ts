import { noChange } from 'lit';
import {
	type AttributePart, Directive, directive,
	type DirectiveParameters, type PartInfo, PartType,
} from 'lit/directive.js';


class EnterDirective extends Directive {

	#initialized = false;
	#enterListener = (ev: KeyboardEvent, listener: (ev: KeyboardEvent) => void) => {
		if (ev.key === 'Enter')
			listener(ev);
	};

	constructor(partInfo: PartInfo) {
		super(partInfo);

		if (partInfo.type !== PartType.ELEMENT) {
			throw new Error(
				'`EnterDirective` can only be used inside an element tag.',
			);
		}
	}

	public override update(part: AttributePart, [ listener ]: DirectiveParameters<this>) {
		if (!this.#initialized) {
			this.#initialized = true;
			part.element.addEventListener('keydown', (ev) => this.#enterListener(ev, listener));
		}

		return noChange;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public override render(listener: (ev: KeyboardEvent) => void): unknown {
		return noChange;
	}

}


/**
 * A directive that attaches a listener to the enter key being pressed.
 */
export const onEnter = directive(EnterDirective);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type { EnterDirective };
