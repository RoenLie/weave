import { debounce } from '@roenlie/core/timing';
import type { RecordOf } from '@roenlie/core/types';
import { type CSSResult, LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';


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
	@query('#scroller')                   protected scrollerQry:   HTMLElement;
	@query('#fullHeight')                 protected fullHeightQry: HTMLElement;
	@query('infinite-scroller-scrollbar') protected scrollbarQry:  ScrollbarCmp;

	#bufferSize = 0;
	public get bufferSize() {
		return this.#bufferSize;
	};

	public set bufferSize(v: number) {
		this.#bufferSize = v;
		this.createPool();
	}

	/**
	 * The amount of initial scroll top.
	 * Needed in order for the user to be able to scroll backwards.
	 */
	protected readonly initialScroll = 10000;

	/** The index/position mapped at _initialScroll point. */
	protected initialIndex = 0;

	/** lowest index list will scroll to. */
	protected minIndex = 0;

	/** highest index list will scroll to. */
	protected abstract maxIndex: number;

	protected preventScrollEvent = false;

	/** This must be an array, as part of the core logic is reversing the order. */
	protected buffers: [BufferElement, BufferElement];
	protected firstIndex = 0;
	protected scrollDisabled = false;
	protected mayHaveMomentum = false;
	protected resizeObserver = new ResizeObserver(([ entry ]) => {
		if (!entry || !this.scrollbarQry)
			return;

		const availableSize = entry.contentRect.height;
		const visibleCount = Math.ceil(availableSize / this.itemHeight) + 2;

		if (this.bufferSize !== visibleCount)
			this.bufferSize = visibleCount;

		this.scrollbarQry.updateScrollPosition();
		this.requestUpdate();
	});

	protected get useScrollbar() {
		return this.minIndex !== undefined && this.maxIndex !== undefined;
	}

	protected get showScrollbar() {
		const itemCount = this.maxIndex - this.minIndex;
		if (!itemCount)
			return false;

		const availableSpace = this.offsetHeight;
		const usedSpace = this.itemHeight * (itemCount + 1);

		return usedSpace > availableSpace;
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

	protected get bufferHeight(): number {
		return this.itemHeight * this.bufferSize;
	}

	protected get totalHeight(): number {
		const itemCount = (this.maxIndex ?? 0) - (this.minIndex ?? 0);

		return this.itemHeight * itemCount;
	}

	public get position(): number {
		return (this.scrollerQry.scrollTop - this.buffers[0]._translateY)
			/ this.itemHeight + this.firstIndex;
	}

	/** Current scroller position as index. Can be a fractional number. */
	public set position(index: number) {
		this.preventScrollEvent = true;
		if (index > this.firstIndex && index < (this.firstIndex + this.bufferSize * 2)) {
			this.scrollerQry.scrollTop = this.itemHeight
				* (index - this.firstIndex)
				+ this.buffers[0]._translateY;
		}
		else {
			this.initialIndex = ~~index;
			this.reset();

			this.scrollDisabled = true;
			this.scrollerQry.scrollTop += (index % 1) * this.itemHeight;
			this.scrollDisabled = false;
		}

		if (this.mayHaveMomentum) {
			// Stop the possible iOS Safari momentum with -webkit-overflow-scrolling: auto;
			this.scrollerQry.classList.add('notouchscroll');
			this.mayHaveMomentum = false;

			setTimeout(() => {
				// Restore -webkit-overflow-scrolling: touch; after a small delay.
				this.scrollerQry.classList.remove('notouchscroll');
			}, 10);
		}

		this.onScroll();
	}
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

		this.#scrollRef = this.onScroll.bind(this);
		this.scrollerQry.addEventListener('scroll', this.#scrollRef, { passive: true });
	}

	protected override firstUpdated(props: Map<PropertyKey, unknown>): void {
		super.firstUpdated(props);

		const bufferEls = this.shadowRoot!.querySelectorAll('.buffer');
		this.buffers = [ ...bufferEls ] as typeof this.buffers;
		this.fullHeightQry.style.height = `${ this.initialScroll * 2 }px`;

		// Firefox interprets elements with overflow:auto as focusable
		// https://bugzilla.mozilla.org/show_bug.cgi?id=1069739
		if (isFirefox)
			this.scrollerQry.tabIndex = -1;
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

		this.initialIndex = ~~this.position;

		// Get the buffers in the correct order as these can be reversed during the scroll.
		const buffers = this.buffers[0].firstElementChild?.getAttribute('name') === 'item-0'
			? [ this.buffers[0], this.buffers[1] ]
			: [ this.buffers[1], this.buffers[0] ];

		const diff = Math.abs(this.bufferSize - currentChildCount);

		if (currentChildCount < this.bufferSize) {
			let itemCount = buffers[0]!.childElementCount + buffers[1]!.childElementCount;
			const itemsToAdd = diff * 2;

			for (let i = 0; i < itemsToAdd; i++)
				this.createAndAppendSlot(buffers[1]!, itemCount++, container);

			for (let i = 0; i < diff; i++)
				buffers[0]!.appendChild(buffers[1]!.firstElementChild!);

			this.stampRemainingInstances();
		}
		else if (currentChildCount > this.bufferSize) {
			const itemsToRemove = diff * 2;

			const elementsExists = buffers[1]!.childElementCount > itemsToRemove
				&& this.childElementCount > itemsToRemove;

			if (!elementsExists) {
				return console.warn(
					'All elements affected by reduction in buffer size are not present.',
					'Buffer size has not been reduced',
				);
			}

			for (let i = 0; i < itemsToRemove; i++) {
				buffers[1]!.lastElementChild!.remove();
				this.lastElementChild!.remove();
			}

			for (let i = 0; i < diff; i++)
				buffers[1]!.prepend(buffers[0]!.lastElementChild!);
		}

		this.reset(true);
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

		if (!this.buffers[0]._translateY)
			this.reset(true);

		this.dispatchEvent(new CustomEvent('init-done'));
	}

	protected translateBuffer(up: boolean): void {
		const index = up ? 1 : 0;
		this.buffers[index]._translateY = this.buffers[up ? 0 : 1]._translateY
			+ this.bufferHeight * (up ? -1 : 1);

		this.buffers[index].style.transform = `translate3d(0, ${
			this.buffers[index]._translateY }px, 0)`;

		this.buffers[index]._updated = false;
		this.buffers.reverse();
	}

	protected blockScroll = (() => {
		let blocked = false;
		const blockTouchMove = (ev: TouchEvent): void => ev.preventDefault();
		const debounced = debounce(() => {
			blocked = false;

			this.scrollerQry.classList.toggle('no-scroll', false);
			document.body.removeEventListener('touchmove', blockTouchMove);
		}, 300);

		return () => {
			if (!blocked) {
				blocked = true;
				this.scrollerQry.classList.toggle('no-scroll', true);
				document.body.addEventListener('touchmove', blockTouchMove);
			}

			debounced();
		};
	})();

	protected onScroll(): void {
		if (this.useScrollbar) {
			if (!this.showScrollbar && this.position !== 0) {
				this.blockScroll();

				return void (this.position = 0);
			}

			this.scrollbarQry.updateScrollPosition();
		}

		if (this.scrollDisabled)
			return;

		// Prevent the scroller from scrolling past the min index.
		if (this.minIndex !== undefined) {
			if (this.position < this.minIndex) {
				this.blockScroll();

				return void (this.position = this.minIndex);
			}
		}

		// Prevent the scroller from scrolling past the max index.
		if (this.maxIndex !== undefined) {
			if (this.position > this.maxIndex) {
				this.blockScroll();

				return void (this.position = this.maxIndex);
			}
		}

		const scrollTop = this.scrollerQry.scrollTop;
		if (
			scrollTop < this.bufferHeight ||
			scrollTop > this.initialScroll * 2 - this.bufferHeight
		) {
			// Scrolled near the end/beginning of the scrollable area -> reset.
			// ~~ is a double Bitwise NOT operator.
			// It is used as a faster substitute for Math.floor() for positive numbers.
			this.initialIndex = ~~this.position;
			this.reset();
		}

		// Check if we scrolled enough to translate the buffer positions.
		const offset = this.itemHeight + this.buffers[0].offsetTop;
		const upperThresholdReached =
			scrollTop > this.buffers[1]._translateY + offset;
		const lowerThresholdReached =
			scrollTop < this.buffers[0]._translateY + offset;

		if (upperThresholdReached || lowerThresholdReached) {
			this.translateBuffer(lowerThresholdReached);
			this.updateElements();
		}

		if (!this.preventScrollEvent) {
			this.dispatchEvent(
				new CustomEvent('custom-scroll', { bubbles: false, composed: true }),
			);
			this.mayHaveMomentum = true;
		}

		this.preventScrollEvent = false;

		this.debounceScroll();
	}

	protected debounceScroll = debounce(() => {
		const scrollerRect = this.scrollerQry.getBoundingClientRect();
		const firstBufferVisible = this.isVisible(this.buffers[0], scrollerRect);
		const secondBufferVisible = this.isVisible(this.buffers[1], scrollerRect);

		if (!firstBufferVisible && !secondBufferVisible)
			this.position = this.position; // eslint-disable-line no-self-assign
	}, 200);

	protected reset(force = false): void {
		this.scrollDisabled = true;
		this.scrollerQry.scrollTop = this.initialScroll;
		this.buffers[0]._translateY = this.initialScroll - this.bufferHeight;
		this.buffers[1]._translateY = this.initialScroll;

		for (const buffer of this.buffers)
			buffer.style.transform = `translate3d(0, ${ buffer._translateY }px, 0)`;

		this.buffers[0]._updated = false;
		this.buffers[1]._updated = false;

		if (force) {
			this.updateElements();
		}
		else {
			this.updateElements(true);
			this.debounceUpdateElements();
		}

		this.scrollDisabled = false;
	}

	public forceUpdateElements() {
		this.buffers[0]._updated = false;
		this.buffers[1]._updated = false;

		this.updateElements();
	}

	protected updateElements(viewPortOnly?: boolean): void {
		this.firstIndex =
			~~((this.buffers[0]._translateY - this.initialScroll) / this.itemHeight)
			+ this.initialIndex;

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
				if (!viewPortOnly ||
					(scrollerRect && this.isVisible(itemWrapper, scrollerRect))
				)
					this.updateElement(itemWrapper._instance, firstIndex + i);
			}

			buffer._updated = true;
		}
	}

	protected debounceUpdateElements = debounce(() => this.forceUpdateElements(), 200);

	protected isVisible(element: HTMLElement, container: DOMRect): boolean {
		const rect = element.getBoundingClientRect();

		return rect.bottom > container.top && rect.top < container.bottom;
	}

	protected scrollerProps = Object.defineProperties({} as ScrollbarCmp['connector'], {
		totalHeight: { get: () => this.totalHeight              },
		itemHeight:  { get: () => this.itemHeight               },
		itemCount:   { get: () => this.maxIndex - this.minIndex },
		position:    {
			get: () => this.position,
			set: v => this.position = v,
		},
	});
	//#endregion


	//#region render
	protected override render(): unknown {
		return html`
		<div id="scroller">
			<div id="buffer1" class="buffer"></div>
			<div id="buffer2" class="buffer"></div>
			<div id="fullHeight"></div>
		</div>

		${ when(this.useScrollbar, () => html`
		<infinite-scroller-scrollbar
			style=${ styleMap({ display: this.showScrollbar ? '' : 'none' }) }
			.modifyScrollTop=${ (amount: number) => this.scrollerQry.scrollTop += amount }
			.connector=${ this.scrollerProps }
		></infinite-scroller-scrollbar>
		`) }
		`;
	}

	protected static _styles: CSSResult = css`
		:host {
			--item-height: 60px;
			--thumb-bg: rgb(80 80 80 / 50%);
			--track-bg: transparent;
			--scroll-width: 16px;

			contain: strict;
			position: relative;
			display: grid;
			grid-template-columns: 1fr max-content;
		}
		#scroller {
			position: relative;
			display: block;
			outline: none;
			overflow-x: hidden;
			-webkit-overflow-scrolling: touch;
		}
		#scroller.notouchscroll {
			-webkit-overflow-scrolling: auto;
		}
		#scroller::-webkit-scrollbar {
			display: none;
		}
		#scroller.no-scroll {
			overflow: hidden;
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


@customElement('infinite-scroller-scrollbar')
export class ScrollbarCmp extends LitElement {

	@property({ type: Object }) public modifyScrollTop: (amount: number) => void;
	@property({ type: Object }) public connector: {
		readonly totalHeight: number;
		readonly itemHeight:  number;
		readonly itemCount:   number;
		position:             number;
	};

	@query('#scroll', true) protected thumbQry: HTMLElement;

	public override connectedCallback(): void {
		super.connectedCallback();

		this.addEventListener('mousedown', this.handleTrackMousedown);
		this.updateComplete.then(() => this.afterConnectedCallback());
	}

	public afterConnectedCallback(): void {
		this.updateScrollPosition();
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.removeEventListener('mousedown', this.handleTrackMousedown);
	}

	public updateScrollPosition(): void {
		const viewportHeight = this.offsetHeight;
		const contentHeight = Math.max(viewportHeight, this.connector.totalHeight);

		const viewableRatio = viewportHeight / contentHeight; // 1/3 or 0.333333333n

		const excessHeight = (this.offsetHeight / this.connector.itemHeight)
			* this.connector.itemHeight;

		const scrollBarArea = viewportHeight * 2
			- (excessHeight + this.connector.itemHeight); // 150px

		const thumbHeight = Math.max(scrollBarArea * viewableRatio, 20); // 50px
		this.thumbQry.style.height = thumbHeight + 'px';

		const modifier = ((viewportHeight - thumbHeight) / this.connector.itemCount);
		const top = Math.max(0, modifier * this.connector.position);

		this.thumbQry.style.transform = `translate3d(0, ${ top }px, 0)`;
	}

	protected handleThumbMousedown = (ev: MouseEvent): void => {
		ev.preventDefault();
		ev.stopPropagation();

		let previousY = ev.y;

		const mousemove = (ev: MouseEvent) => {
			if ((ev.y - previousY) === 0)
				return;

			const contentHeight = this.connector.totalHeight;
			const viewportHeight = this.offsetHeight;

			const multiplier = contentHeight / viewportHeight;
			const distance = (ev.y - previousY) * multiplier;
			previousY = ev.y;

			this.modifyScrollTop(distance);
		};

		const mouseup = () => {
			window.removeEventListener('pointermove', mousemove);
			window.removeEventListener('pointerup', mouseup);
		};

		window.addEventListener('pointermove', mousemove);
		window.addEventListener('pointerup', mouseup);
	};

	protected handleTrackMousedown = (ev: MouseEvent): void => {
		ev.preventDefault();

		const hostRect = this.getBoundingClientRect();
		const percent = calculatePercentage(ev.y, hostRect.top, hostRect.bottom);
		const newPos = (this.connector.itemCount / 100) * percent;

		this.connector.position = Math.max(0, newPos);

		requestAnimationFrame(() => this.handleThumbMousedown(ev));
	};

	protected override render(): unknown {
		return html`
		<s-scroll-thumb id="scroll"
			@mousedown=${ this.handleThumbMousedown }
		></s-scroll-thumb>
		`;
	}

	public static override styles = css`
	:host {
		position: relative;
		display: block;
		width: var(--scroll-width);
		background-color: var(--track-bg);
	}
	s-scroll-thumb {
		position: absolute;
		display: block;
		width: 100%;
		background-color: var(--thumb-bg);
	}
	`;

}


const isFirefox = /Firefox/u.test(navigator.userAgent);


const calculatePercentage = (
	current: number,
	min: number,
	max: number,
): number => ((current - min) / (max - min)) * 100;
