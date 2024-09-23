import type { RecordOf } from '@roenlie/core/types';
import { type CSSResult, LitElement, type PropertyValues, css, html } from 'lit';
import { query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';


interface BufferElement extends HTMLElement {
	_translateY: number;
	_updated:    boolean;
	children:    HTMLCollectionOf<HTMLSlotElement>;
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
			this.onResize();
			this.fullHeightQry.style.height = this.totalHeight + 'px';

			this.forceUpdateElements();
		}
	}

	/** This must be an array, as part of the core logic is reversing the order. */
	protected buffers: [BufferElement, BufferElement];

	#bufferSize = 0;
	public get bufferSize(): number {
		return this.#bufferSize;
	};

	public set bufferSize(v: number) {
		this.#bufferSize = v;

		if (this.hasUpdated)
			this.fullHeightQry.style.height = this.totalHeight + 'px';

		this.createPool();
	}

	protected get bufferHeight(): number {
		return this.itemHeight * this.bufferSize;
	}

	#itemHeight = 0;
	public set itemHeight(v: number) {
		this.#itemHeight = v;

		if (this.hasUpdated) {
			this.scrollerQry.style.setProperty('--_item-height', this.#itemHeight + 'px');
			this.onResize();
			this.forceUpdateElements();
		}
	}

	public get itemHeight(): number {
		if (!this.#itemHeight && this.hasUpdated) {
			const itemHeight = getComputedStyle(this)
				.getPropertyValue('--item-height');

			// Use background-position temp inline style for unit conversion
			const tmpStyleProp = 'background-position';
			this.fullHeightQry.style.setProperty(tmpStyleProp, itemHeight);

			const itemHeightPx = getComputedStyle(this.fullHeightQry)
				.getPropertyValue(tmpStyleProp);

			this.fullHeightQry.style.removeProperty(tmpStyleProp);
			this.#itemHeight = parseFloat(itemHeightPx);
			this.scrollerQry.style.setProperty('--_item-height', this.#itemHeight + 'px');
		}

		return this.#itemHeight;
	}

	protected get totalHeight(): number {
		const modifiedMaxIndex = this.maxIndex
			+ (this.bufferSize - this.maxIndex % this.bufferSize);

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

	#availableSize = 0;
	protected readonly resizeObserver = new ResizeObserver(this.onResize.bind(this));
	protected onResize(entries?: ResizeObserverEntry[]): boolean {
		const entry = entries?.[0];
		if (entry)
			this.#availableSize = entry.contentRect.height;

		const minimumBuffer = Math.ceil(this.#availableSize / this.itemHeight);

		if (this.bufferSize !== minimumBuffer) {
			if (this.maxIndex <= minimumBuffer) {
				this.bufferSize = this.maxIndex;
				this.ensureBufferTranslate();
				this.forceUpdateElements();
			}
			else {
				this.bufferSize = minimumBuffer + 2;
			}

			return true;
		}

		return false;
	};
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

		// No children, this is the first time creating the pool.
		if (currentChildCount === 0) {
			let id = 0;

			for (const buffer of this.buffers) {
				for (let i = 0; i < this.bufferSize; i++)
					this.createAndAppendSlot(buffer, id++);
			}

			this.ensureBufferTranslate();

			return void requestAnimationFrame(() => {
				this.syncBufferTranslate();
				this.forceUpdateElements();

				this.dispatchEvent(new CustomEvent('ready'));
			});
		}

		// If the buffer size has increased, create the new slots.
		let currentCount = this.buffers[0].childElementCount
			+ this.buffers[1].childElementCount;

		if (currentChildCount < this.bufferSize) {
			for (const buffer of this.buffers) {
				for (let i = currentChildCount; i < this.bufferSize; i++)
					this.createAndAppendSlot(buffer, currentCount++);
			}
		}
		// If the buffer size has decreased, remove the extra slots.
		else {
			for (const buffer of this.buffers) {
				while (buffer.childElementCount > this.bufferSize) {
					const el = buffer.lastElementChild as HTMLSlotElement;
					el.assignedElements()[0]?.remove();
					el.remove();
				}
			}
		}

		// Update the slot names and the assigned elements.
		let count = 0;
		for (const buffer of this.buffers) {
			for (const slot of buffer.children)
				slot.setAttribute('name', 'item-' + count++);
		}

		// Update the assigned elements slot attribute.
		count = 0;
		while (this.childElementCount > count) {
			this.children[count]!.setAttribute('slot', 'item-' + count);
			count++;
		}

		// Translate the buffers to the correct position.
		const difference = this.bufferSize - currentChildCount;
		if (difference > 0) {
			this.buffers[0]._translateY += difference * this.itemHeight;
			this.buffers[1]._translateY += difference * this.itemHeight + this.itemHeight;
		}
		else if (difference < 0) {
			this.buffers[0]._translateY += difference * this.itemHeight + this.itemHeight;
			this.buffers[1]._translateY += difference * this.itemHeight;
		}

		for (const buffer of this.buffers)
			buffer.style.transform = `translate3d(0, ${ buffer._translateY }px, 0)`;

		this.syncBufferTranslate();
		this.forceUpdateElements();
	}

	protected createAndAppendSlot(buffer: BufferElement, id: number): void {
		const slotName = `item-${ id }`;

		const itemWrapper = document.createElement('div');
		itemWrapper.setAttribute('slot', slotName);
		itemWrapper.style.display = 'contents';
		itemWrapper.appendChild(this.createElement());

		const slot = document.createElement('slot');
		slot.setAttribute('name', slotName);

		buffer.appendChild(slot);
		this.appendChild(itemWrapper);
	}

	protected ensureBufferTranslate(): void {
		// Ensure the buffers have been given a translateY value.
		// Also reset the translateY value of the buffers.
		this.buffers[0]!._translateY = -this.bufferHeight;
		this.buffers[1]!._translateY = 0;

		for (const buffer of this.buffers)
			buffer.style.transform = `translate3d(0, ${ buffer._translateY }px, 0)`;
	}

	protected translateBuffer(up: boolean): boolean {
		if (~~this.position < 0)
			return false;
		if ((this.position + this.bufferSize) > this.maxIndex)
			return false;

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
				if (maxIterations > 1)
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

	public forceUpdateElements(): void {
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
				const slottedItem = slot.assignedElements()[0] as HTMLElement;

				if (!viewPortOnly || this.isVisible(slottedItem, scrollerRect)) {
					this.updateElement(slottedItem.firstElementChild as HTMLElement,
						firstIndex + i);
				}
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
		<div part="scroller" id="scroller" tabindex=-1 style=${ styleMap({
			'--_item-height': `${ this.itemHeight }px`,
		}) }>
			<div part="buffer" class="buffer"></div>
			<div part="buffer" class="buffer"></div>
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
			grid-auto-rows: var(--_item-height, var(--item-height));
		}
	`;
	//#endregion

}
