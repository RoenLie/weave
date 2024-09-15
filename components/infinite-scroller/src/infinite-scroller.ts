import type { RecordOf } from '@roenlie/core/types';
import { type CSSResult, LitElement, type PropertyValues, css, html } from 'lit';
import { query, state } from 'lit/decorators.js';


interface BufferElement extends HTMLElement {
	_translateY: number;
	_updated:    boolean;
	children:    HTMLCollectionOf<SlotElement>;
}


interface SlotElement extends HTMLSlotElement {
	_itemWrapper: ItemElement;
}


interface ItemElement extends HTMLDivElement {
	_instance: HTMLElement & Record<PropertyKey, unknown>;
}


export abstract class InfiniteScroller extends LitElement {

	protected abstract createElement(): RecordOf<HTMLElement>;
	protected abstract updateElement(element: HTMLElement, index: number): void;


	//#region properties
	@query('#scroller')   protected scrollerQry:   HTMLElement;
	@query('#fullHeight') protected fullHeightQry: HTMLElement;

	#maxIndex = 1;
	public get maxIndex(): number {
		return this.#maxIndex;
	}

	@state() protected set maxIndex(v: number) {
		this.#maxIndex = Math.max(1, v);

		if (this.hasUpdated) {
			this.fullHeightQry.style.height = this.totalHeight + 'px';
			this.forceUpdateElements();
		}
	}

	/** This must be an array, as part of the core logic is reversing the order. */
	protected buffers: [BufferElement, BufferElement];

	#bufferSize = 0;
	public get bufferSize() {
		return this.#bufferSize;
	};

	public set bufferSize(v: number) {
		this.#bufferSize = v;

		for (const buffer of this.buffers) {
			while (buffer.lastElementChild)
				buffer.lastElementChild.remove();
		}

		while (this.lastElementChild)
			this.lastElementChild.remove();

		this.createPool();

		// Ensure the buffers have been given a translateY value after a buffer size change.
		const buffers = this.buffers[0].firstElementChild?.getAttribute('name') === 'item-0'
			? [ this.buffers[0], this.buffers[1] ]
			: [ this.buffers[1], this.buffers[0] ];

		buffers[0]!._translateY = -this.bufferHeight;
		buffers[1]!._translateY = 0;

		for (const buffer of buffers)
			buffer.style.transform = `translate3d(0, ${ buffer._translateY }px, 0)`;
	}

	protected get bufferHeight(): number {
		return this.itemHeight * this.bufferSize;
	}

	#itemHeight = 0;
	public get itemHeight(): number {
		if (!this.#itemHeight && this.fullHeightQry) {
			const itemHeight = getComputedStyle(this)
				.getPropertyValue('--item-height');

			// Use background-position temp inline style for unit conversion
			const tmpStyleProp = 'background-position';
			this.fullHeightQry.style.setProperty(tmpStyleProp, itemHeight);

			const itemHeightPx = getComputedStyle(this.fullHeightQry)
				.getPropertyValue(tmpStyleProp);

			this.fullHeightQry.style.removeProperty(tmpStyleProp);
			this.#itemHeight = parseFloat(itemHeightPx);
		}

		return this.#itemHeight;
	}

	protected get totalHeight(): number {
		const modifiedMaxIndex = Math.ceil(this.maxIndex / this.bufferSize) * this.bufferSize;

		return this.itemHeight * modifiedMaxIndex;
	}

	protected get firstIndex(): number {
		return ~~(this.buffers[0]._translateY / this.itemHeight);
	}

	/** Current scroller position as index. Can be a fractional number. */
	public get position(): number {
		return (this.scrollerQry.scrollTop - this.buffers[0]._translateY)
			/ this.itemHeight + this.firstIndex;
	}

	public set position(index: number) {
		// Ensure the index is within bounds.
		index = Math.max(0, Math.min(index, this.maxIndex));

		this.scrollerQry.scrollTop = this.itemHeight
			* (index - this.firstIndex)
			+ this.buffers[0]._translateY;
	}

	protected readonly resizeObserver = new ResizeObserver(([ entry ]) => {
		if (!entry)
			return;

		const availableSize = entry.contentRect.height;
		const visibleCount = Math.ceil(availableSize / this.itemHeight) + 2;

		if (this.bufferSize !== visibleCount) {
			this.bufferSize = visibleCount;
			this.fullHeightQry.style.height = this.totalHeight + 'px';
		}
	});
	//#endregion


	//#region lifecycle
	protected override createRenderRoot(): HTMLElement | DocumentFragment {
		// This ensures that the custom styles will always be included
		// when this component is extended.
		const base = (this.constructor as typeof InfiniteScroller);
		const styles = base.elementStyles;
		if (!styles.includes(base._styles))
			styles.unshift(InfiniteScroller._styles);

		return super.createRenderRoot();
	}

	public override connectedCallback(): void {
		super.connectedCallback();
		this.updateComplete.then(() => this.afterConnectedCallback());
	}

	#scrollRef?: () => any;
	public afterConnectedCallback(): void {
		this.resizeObserver.observe(this);
		this.scrollerQry.addEventListener('scroll',
			this.#scrollRef = this.onScroll.bind(this), { passive: true });
	}

	protected override firstUpdated(changedProps: PropertyValues): void {
		super.firstUpdated(changedProps);

		const bufferEls = this.renderRoot.querySelectorAll('.buffer');
		this.buffers = [ ...bufferEls ] as typeof this.buffers;
	}

	public override disconnectedCallback(): void {
		if (this.#scrollRef)
			this.scrollerQry.removeEventListener('scroll', this.#scrollRef);

		this.resizeObserver.disconnect();
		super.disconnectedCallback();
	}
	//#endregion


	//#region logic
	protected createPool(): void {
		// If there is no change in buffer size, ignore the function call.
		const currentChildCount = this.buffers[0].childElementCount;
		if (currentChildCount === this.bufferSize)
			return;

		const container = this.getBoundingClientRect();

		// No children, this is the first time creating the pool.
		if (currentChildCount === 0) {
			let id = 0;

			for (const buffer of this.buffers) {
				for (let i = 0; i < this.bufferSize; i++)
					this.createAndAppendSlot(buffer, id++, container);
			}

			// Wait for the dom to render the elements before stamping remaining instances.
			return void requestAnimationFrame(() => this.stampRemainingInstances());
		}
	}

	protected createAndAppendSlot(buffer: BufferElement, id: number, container: DOMRect): void {
		const slotName = `item-${ id }`;

		const itemWrapper = document.createElement('div') as ItemElement;
		itemWrapper.setAttribute('slot', slotName);
		itemWrapper.style.display = 'contents';
		itemWrapper._instance = {} as RecordOf<HTMLElement>;

		const slot = document.createElement('slot') as SlotElement;
		slot._itemWrapper = itemWrapper;
		slot.setAttribute('name', slotName);

		buffer.appendChild(slot);
		this.appendChild(itemWrapper);

		// Only stamp the visible instances first
		if (this.isVisible(itemWrapper, container))
			this.ensureStampedInstance(itemWrapper);
	}

	protected ensureStampedInstance(itemWrapper: ItemElement): void {
		if (itemWrapper.firstElementChild)
			return;

		const tmpInstance = itemWrapper._instance;

		itemWrapper._instance = this.createElement();
		itemWrapper.appendChild(itemWrapper._instance);

		for (const prop of Object.keys(tmpInstance))
			itemWrapper._instance[prop] = tmpInstance[prop]!;
	}

	protected stampRemainingInstances(): void {
		// Once the first set of items start fading in, stamp the rest
		for (const buffer of this.buffers) {
			for (const slot of buffer.children)
				this.ensureStampedInstance(slot._itemWrapper);
		}

		this.syncBufferTranslate();
		this.forceUpdateElements();

		this.dispatchEvent(new CustomEvent('ready'));
	}

	protected translateBuffer(up: boolean): boolean {
		if (up) {
			if (~~this.position < 0)
				return false;
		}
		else {
			if ((this.position + this.bufferSize) > this.maxIndex)
				return false;
		}

		const index = up ? 1 : 0;

		this.buffers[index]._translateY = this.buffers[up ? 0 : 1]._translateY
			+ this.bufferHeight * (up ? -1 : 1);

		this.buffers[index].style.transform = `translate3d(0, ${
			this.buffers[index]._translateY }px, 0)`;

		this.buffers[index]._updated = false;
		this.buffers.reverse();

		return true;
	}

	protected onScroll(): void {
		if (this.syncBufferTranslate())
			this.updateElements();
	}

	public syncBufferTranslate(): boolean {
		const scrollTop = this.scrollerQry.scrollTop;

		let upperThresholdReached = false;
		let lowerThresholdReached = false;
		let updateElements = false;

		// Limit the number of iterations to prevent infinite loops.
		const maxIterations = this.totalHeight / this.bufferHeight;
		let count = 0;

		do {
			count++;
			if (count > maxIterations) {
				console.warn('Infinite loop detected in syncBufferTranslate');
				break;
			}

			// Check if we scrolled enough to translate the buffer positions.
			const offset = this.itemHeight + this.buffers[0].offsetTop;
			upperThresholdReached = scrollTop > this.buffers[1]._translateY + offset;
			lowerThresholdReached = scrollTop < this.buffers[0]._translateY + offset;

			if (upperThresholdReached || lowerThresholdReached) {
				if (!this.translateBuffer(lowerThresholdReached))
					break;

				updateElements = true;
			}

			// Keep translating until the buffer is within the viewport.
		} while (upperThresholdReached || lowerThresholdReached);

		return updateElements;
	}

	public forceUpdateElements() {
		this.buffers[0]._updated = false;
		this.buffers[1]._updated = false;

		this.updateElements();
	}

	protected updateElements(viewPortOnly?: boolean): void {
		const scrollerRect = viewPortOnly
			? this.scrollerQry.getBoundingClientRect()
			: undefined;

		for (let i = 0; i < this.buffers.length; i++) {
			const buffer = this.buffers[i]!;
			if (buffer._updated)
				continue;

			const firstIndex = this.firstIndex + this.bufferSize * i;

			for (let i = 0; i < buffer.children.length; i++) {
				const slot = buffer.children[i]!;

				const itemWrapper = slot._itemWrapper;
				if (!viewPortOnly || this.isVisible(itemWrapper, scrollerRect))
					this.updateElement(itemWrapper._instance, firstIndex + i);
			}

			buffer._updated = true;
		}
	}

	protected isVisible(element: HTMLElement, container?: DOMRect): boolean {
		if (!container)
			return false;

		const rect = element.getBoundingClientRect();

		return rect.bottom > container.top && rect.top < container.bottom;
	}
	//#endregion


	//#region render
	protected override render(): unknown {
		return html`
		<div id="scroller" tabindex=-1>
			<div class="buffer"></div>
			<div class="buffer"></div>
			<div id="fullHeight"></div>
		</div>
		`;
	}

	// These styles will always be included when this component is extended.
	protected static _styles: CSSResult = css`
		:host {
			--item-height: 60px;

			position: relative;
			display: grid;
			grid-template-columns: 1fr;
		}
		#scroller {
			position: relative;
			display: block;
			outline: none;
			overflow: hidden;
			overflow-y: auto;
			contain: strict;
		}
		.buffer {
			box-sizing: border-box;
			position: absolute;
			top: 0;
			width: 100%;
			display: grid;
			grid-auto-rows: var(--item-height);
		}
	`;
	//#endregion

}
