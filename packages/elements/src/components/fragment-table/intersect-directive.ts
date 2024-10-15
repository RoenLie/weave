import { noChange } from 'lit';
import { AsyncDirective } from 'lit/async-directive.js';
import { type AttributePart, directive, type DirectiveParameters, type PartInfo, PartType } from 'lit/directive.js';


class IntersectDirective extends AsyncDirective {

	#part:     AttributePart;
	#observer: IntersectionObserver;
	#initialized = false;

	constructor(part: PartInfo) {
		super(part);

		if (part.type !== PartType.ELEMENT)
			throw new Error('`intersect()` can only be used directly in an element.');

		this.#part = part as unknown as AttributePart;
	}

	public override update(_part: AttributePart, [ observer ]: DirectiveParameters<this>) {
		if (!this.#initialized) {
			this.#initialized = true;
			(async () => {
				const obs = await observer;

				this.#observer = obs;
				this.#observer.observe(this.#part.element);
			})();
		}

		return noChange;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public render(observer: IntersectionObserver | Promise<IntersectionObserver>) {
		return noChange;
	}

	protected override disconnected() {
		super.disconnected();
		this.#observer.unobserve(this.#part.element);
	}

	protected override reconnected() {
		super.reconnected();
		this.#observer.observe(this.#part.element);
	}

}


export const intersect = directive(IntersectDirective);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type { IntersectDirective };
