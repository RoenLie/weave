import { debounce, withDebounce } from '@roenlie/mimic-core/timing';
import type { RecordOf } from '@roenlie/mimic-core/types';
import { queryId } from '@roenlie/mimic-lit/decorators';
import { MimicElement, customElement } from '@roenlie/mimic-lit/element';
import { type CSSResultGroup, css, html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { until } from 'lit/directives/until.js';
import { when } from 'lit/directives/when.js';

interface BufferElement extends HTMLElement {
	translateY: number;
	updated: boolean;
	children: HTMLCollectionOf<SlotElement>;
}

interface SlotElement extends HTMLSlotElement {
	_itemWrapper: ItemWrapperElement;
}

interface ItemWrapperElement extends HTMLDivElement {
	instance: HTMLElement & Record<PropertyKey, unknown>;
}

// TODO, Make the minimum buffer change depending on available space.
export abstract class InfiniteScroller extends MimicElement {
	@queryId('scroller') protected scrollerQry: HTMLElement;
	@queryId('fullHeight') protected fullHeightQry: HTMLElement;
	@query('infinite-scroller-scrollbar') protected scrollbarQry: ScrollbarCmp;

	/**
	 * Count of individual items in each buffer.
	 * The scroller has 2 buffers altogether so bufferSize of 20
	 * will result in 40 buffered DOM items in total.
	 * Changing after initialization not supported.
	 */
	public bufferSize = 20;

	/**
	 * The amount of initial scroll top.
	 * Needed in order for the user to be able to scroll backwards.
	 */
	protected initialScroll = 50000;

	/** The index/position mapped at _initialScroll point. */
	protected initialIndex = 0;

	/** lowest index list will scroll to. */
	protected minIndex?: number;

	/** highest index list will scroll to. */
	protected maxIndex?: number;

	protected preventScrollEvent: boolean;

	/** This must be an array, as part of the core logic is reversing the order. */
	protected buffers: [BufferElement, BufferElement];
	protected firstIndex: number;
	protected scrollDisabled: boolean;
	protected mayHaveMomentum: boolean;
	protected initDone: boolean;
	protected resizeObserver: ResizeObserver;

	protected debounceScroll = debounce(() => {
		const scrollerRect = this.scrollerQry.getBoundingClientRect();
		const firstBufferVisible = this.isVisible(this.buffers[0], scrollerRect);
		const secondBufferVisible = this.isVisible(this.buffers[1], scrollerRect);

		if (!firstBufferVisible && !secondBufferVisible)
			this.position = this.position; // eslint-disable-line no-self-assign
	}, 200);

	protected debounceBlockScroll = withDebounce(
		() => {
			this.scrollerQry.style.setProperty('overflow', 'hidden');
		},
		() => {
			this.scrollerQry.style.removeProperty('overflow');
		},
		100,
	);

	protected debounceUpdateClones = debounce(() => {
		this.buffers[0].updated = false;
		this.buffers[1].updated = false;

		this.updateClones();
	}, 200);

	protected get useScrollbar() {
		return this.minIndex !== undefined && this.maxIndex !== undefined;
	}

	protected get showScrollbar() {
		const itemCount = (this.maxIndex ?? 0) - (this.minIndex ?? 0);
		if (!itemCount) return false;

		const availableSpace = this.offsetHeight;
		const usedSpace = this.itemHeight * (itemCount + 1);

		return usedSpace > availableSpace;
	}

	/** This must be set to true for the scroller to initialized. */
	#active = false;
	public get active(): boolean {
		return this.#active;
	}
	public set active(active) {
		if (this.#active || !active) return;

		this.createPool();
		this.#active = true;
	}

	public get bufferOffset(): number {
		return this.buffers[0].offsetTop;
	}

	#itemHeight = 0;
	public get itemHeight(): number {
		if (!this.#itemHeight && this.fullHeightQry) {
			const itemHeight = getComputedStyle(this).getPropertyValue(
				'--_infinite-scroller-item-height',
			);

			// Use background-position temp inline style for unit conversion
			const tmpStyleProp = 'background-position';
			this.fullHeightQry.style.setProperty(tmpStyleProp, itemHeight);

			const itemHeightPx = getComputedStyle(
				this.fullHeightQry,
			).getPropertyValue(tmpStyleProp);

			this.fullHeightQry.style.removeProperty(tmpStyleProp);
			this.#itemHeight = parseFloat(itemHeightPx);
		}

		return this.#itemHeight;
	}

	protected get bufferHeight(): number {
		return this.itemHeight * this.bufferSize;
	}

	protected get totalHeight(): number {
		const itemLength = (this.maxIndex ?? 0) - (this.minIndex ?? 0);

		return this.itemHeight * itemLength;
	}

	public get position(): number {
		return (
			(this.scrollerQry.scrollTop - this.buffers[0].translateY) /
				this.itemHeight +
			this.firstIndex
		);
	}

	/** Current scroller position as index. Can be a fractional number. */
	public set position(index: number) {
		this.preventScrollEvent = true;
		if (
			index > this.firstIndex &&
			index < this.firstIndex + this.bufferSize * 2
		) {
			this.scrollerQry.scrollTop =
				this.itemHeight * (index - this.firstIndex) +
				this.buffers[0].translateY;
		} else {
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
	}

	public override afterConnectedCallback(): void {
		this.resizeObserver = new ResizeObserver(() => {
			this.requestUpdate();
			this.scrollbarQry.updateScrollPosition();
		});
		this.resizeObserver.observe(this);
	}

	protected override firstUpdated(props: Map<PropertyKey, unknown>) {
		super.firstUpdated(props);

		const bufferEls = this.shadowRoot!.querySelectorAll('.buffer');
		this.buffers = [...bufferEls] as typeof this.buffers;
		this.fullHeightQry.style.height = `${this.initialScroll * 2}px`;
		this.scrollerQry.addEventListener('scroll', this.handleScroll.bind(this), {
			passive: true,
		});

		// Firefox interprets elements with overflow:auto as focusable
		// https://bugzilla.mozilla.org/show_bug.cgi?id=1069739
		if (isFirefox) this.scrollerQry.tabIndex = -1;
	}

	protected createPool() {
		const container = this.getBoundingClientRect();
		let id = 0;

		for (const buffer of this.buffers) {
			for (let i = 0; i < this.bufferSize; i++) {
				const slotName = `infinite-scroller-item-content-${id++}`;

				const itemWrapper = document.createElement('div') as ItemWrapperElement;
				itemWrapper.setAttribute('slot', slotName);
				itemWrapper.instance = {} as RecordOf<HTMLElement>;

				const slot = document.createElement('slot') as SlotElement;
				slot._itemWrapper = itemWrapper;
				slot.setAttribute('name', slotName);

				buffer.appendChild(slot);
				this.appendChild(itemWrapper);

				// Only stamp the visible instances first
				if (this.isVisible(itemWrapper, container))
					this.ensureStampedInstance(itemWrapper);
			}
		}

		requestAnimationFrame(() => this.finishInit());
	}

	protected ensureStampedInstance(itemWrapper: ItemWrapperElement) {
		if (itemWrapper.firstElementChild) return;

		const tmpInstance = itemWrapper.instance;

		itemWrapper.instance = this.createElement();
		itemWrapper.style.display = 'contents';
		itemWrapper.appendChild(itemWrapper.instance);

		for (const prop of Object.keys(tmpInstance))
			itemWrapper.instance[prop] = tmpInstance[prop]!;
	}

	protected finishInit() {
		if (this.initDone) return;

		// Once the first set of items start fading in, stamp the rest
		for (const buffer of this.buffers) {
			for (const slot of buffer.children)
				this.ensureStampedInstance(slot._itemWrapper);
		}

		if (!this.buffers[0].translateY) this.reset();

		this.initDone = true;
		this.dispatchEvent(new CustomEvent('init-done'));
	}

	/** Force the scroller to update clones, without waiting for the debouncer to resolve. */
	public forceUpdate() {
		this.buffers[0].updated = false;
		this.buffers[1].updated = false;

		this.updateClones();
		this.debounceUpdateClones.cancel();
	}

	protected abstract createElement(): RecordOf<HTMLElement>;
	protected abstract updateElement(element: HTMLElement, index: number): void;

	protected translateBuffer(up: boolean) {
		const index = up ? 1 : 0;
		this.buffers[index].translateY =
			this.buffers[up ? 0 : 1].translateY + this.bufferHeight * (up ? -1 : 1);
		this.buffers[index].style.transform =
			`translate3d(0, ${this.buffers[index].translateY}px, 0)`;
		this.buffers[index].updated = false;
		this.buffers.reverse();
	}

	protected handleScroll() {
		if (this.useScrollbar) {
			if (!this.showScrollbar) {
				this.position = 0;

				return this.debounceBlockScroll();
			}

			this.scrollbarQry.updateScrollPosition();
		}

		if (this.scrollDisabled) return;

		if (this.minIndex !== undefined) {
			if (this.position < this.minIndex) {
				this.position = this.minIndex;

				return this.debounceBlockScroll();
			}
		}

		if (this.maxIndex !== undefined) {
			if (this.position > this.maxIndex) {
				this.position = this.maxIndex;

				return this.debounceBlockScroll();
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
		const offset = this.itemHeight + this.bufferOffset;
		const upperThresholdReached =
			scrollTop > this.buffers[1].translateY + offset;
		const lowerThresholdReached =
			scrollTop < this.buffers[0].translateY + offset;

		if (upperThresholdReached || lowerThresholdReached) {
			this.translateBuffer(lowerThresholdReached);
			this.updateClones();
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

	protected reset() {
		this.scrollDisabled = true;
		this.scrollerQry.scrollTop = this.initialScroll;
		this.buffers[0].translateY = this.initialScroll - this.bufferHeight;
		this.buffers[1].translateY = this.initialScroll;

		for (const buffer of this.buffers)
			buffer.style.transform = `translate3d(0, ${buffer.translateY}px, 0)`;

		this.buffers[0].updated = false;
		this.buffers[1].updated = false;

		this.updateClones(true);
		this.debounceUpdateClones();

		this.scrollDisabled = false;
	}

	protected updateClones(viewPortOnly?: boolean) {
		this.firstIndex =
			~~((this.buffers[0].translateY - this.initialScroll) / this.itemHeight) +
			this.initialIndex;

		const scrollerRect = viewPortOnly
			? this.scrollerQry.getBoundingClientRect()
			: undefined;

		for (let i = 0; i < this.buffers.length; i++) {
			const buffer = this.buffers[i]!;
			if (buffer.updated) continue;

			const firstIndex = this.firstIndex + this.bufferSize * i;

			for (let i = 0; i < buffer.children.length; i++) {
				const slot = buffer.children[i]!;

				const itemWrapper = slot._itemWrapper;
				if (
					!viewPortOnly ||
					(scrollerRect && this.isVisible(itemWrapper, scrollerRect))
				)
					this.updateElement(itemWrapper.instance, firstIndex + i);
			}

			buffer.updated = true;
		}
	}

	protected isVisible(element: HTMLElement, container: DOMRect) {
		const rect = element.getBoundingClientRect();

		return rect.bottom > container.top && rect.top < container.bottom;
	}

	protected scrollerProps = (() => {
		const obj = {};
		Object.defineProperties(obj, {
			totalHeight: {
				get: () => this.totalHeight,
			},
			itemCount: {
				get: () => (this.maxIndex ?? 0) - (this.minIndex ?? 0),
			},
			itemHeight: {
				get: () => this.itemHeight,
			},
			position: {
				get: () => this.position,
				set: (v: number) => {
					this.position = v;
				},
			},
		});

		return obj as {
			readonly totalHeight: number;
			readonly itemCount: number;
			readonly itemHeight: number;
			position: number;
		};
	})();

	protected override render(): unknown {
		return html`
		<div id="scroller">
			<div class="buffer"></div>
			<div class="buffer"></div>
			<div id="fullHeight"></div>
		</div>

		${until(
			this.updateComplete.then(() =>
				when(
					this.useScrollbar,
					() => html`
					<infinite-scroller-scrollbar
						style=${styleMap({ display: this.showScrollbar ? '' : 'none' })}
						.connector=${this.scrollerProps}
					></infinite-scroller-scrollbar>
					`,
				),
			),
		)}
		`;
	}

	public static override styles: CSSResultGroup = css`
		:host {
			--_infinite-scroller-item-height: 100px;
			--_infinite-scroller-buffer-width: 100%;
			--_infinite-scroller-buffer-offset: 0;
			--_infinite-scroller-thumb: rgb(80 80 80 / 50%);

			overflow: hidden;
			position: relative;
			display: grid;
			grid-template-columns: 1fr auto;
		}
		#scroller {
			position: relative;
			height: 100%;
			overflow: auto;
			outline: none;
			-webkit-overflow-scrolling: touch;
			overflow-x: hidden;
		}
		#scroller.notouchscroll {
			-webkit-overflow-scrolling: auto;
		}
		#scroller::-webkit-scrollbar {
			display: none;
		}
		.buffer {
			box-sizing: border-box;
			position: absolute;
			top: var(--_infinite-scroller-buffer-offset);
			width: var(--_infinite-scroller-buffer-width);
			animation: fadein 0.2s;

			display: grid;
			grid-auto-rows: var(--_infinite-scroller-item-height);
		}
		@keyframes fadein {
			from { opacity: 0; }
			to { opacity: 1; }
		}
	`;
}

@customElement('infinite-scroller-scrollbar')
export class ScrollbarCmp extends MimicElement {
	@property({ type: Object }) public connector: {
		readonly totalHeight: number;
		readonly itemCount: number;
		readonly itemHeight: number;
		position: number;
	};
	@queryId('scroll', true) protected thumbQry: HTMLElement;
	protected abortSig: AbortController;
	protected get excessHeight() {
		return (
			(this.offsetHeight / this.connector.itemHeight) *
			this.connector.itemHeight
		);
	}

	public override connectedCallback(): void {
		super.connectedCallback();

		this.abortSig = new AbortController();
		this.addEventListener('mousedown', this.handleTrackMousedown, {
			signal: this.abortSig.signal,
		});
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.abortSig.abort();
	}

	public override afterConnectedCallback(): void {
		this.updateScrollPosition();
	}

	public updateScrollPosition(): void {
		const viewportHeight = this.offsetHeight;
		const contentHeight = Math.max(viewportHeight, this.connector.totalHeight);

		const viewableRatio = viewportHeight / contentHeight; // 1/3 or 0.333333333n
		const scrollBarArea =
			viewportHeight * 2 - (this.excessHeight + this.connector.itemHeight); // 150px
		const thumbHeight = Math.max(scrollBarArea * viewableRatio, 20); // 50px

		this.thumbQry.style.height = `${thumbHeight}px`;

		const top = Math.max(
			0,
			((viewportHeight - thumbHeight) / this.connector.itemCount) *
				this.connector.position,
		);

		this.thumbQry.style.transform = `translate3d(0, ${top}px, 0)`;
	}

	protected handleThumbMousedown(ev: MouseEvent): void {
		ev.preventDefault();
		ev.stopPropagation();

		const rect = this.thumbQry.getBoundingClientRect();
		const offsetY = ev.y - rect.y;

		const mousemove = (ev: MouseEvent) => {
			const rect = this.thumbQry.getBoundingClientRect();
			const distance = ev.y - rect.y - offsetY;

			const contentHeight = this.connector.totalHeight;
			const viewportHeight = this.offsetHeight;

			const viewableRatio = viewportHeight / contentHeight; // 1/3 or 0.333333333n
			const scrollBarArea = viewportHeight * 2 - this.excessHeight; // 150px
			const thumbHeight = Math.max(scrollBarArea * viewableRatio, 20); // 50px

			const scrollTrackSpace = contentHeight - viewportHeight; // (600 - 200) = 400
			const scrollThumbSpace = viewportHeight - thumbHeight; // (200 - 50) = 150
			const scrollJump = scrollTrackSpace / scrollThumbSpace; // (400 / 150 ) = 2.6667

			const jumpDistance = scrollJump * distance;
			const positionChange = jumpDistance / this.connector.itemHeight;

			this.connector.position = Math.max(
				0,
				this.connector.position + positionChange,
			);
		};

		const mouseup = () => {
			window.removeEventListener('mousemove', mousemove);
			window.removeEventListener('mouseup', mouseup);
		};

		window.addEventListener('mousemove', mousemove);
		window.addEventListener('mouseup', mouseup);
	}

	protected handleTrackMousedown(ev: MouseEvent): void {
		ev.preventDefault();

		const hostRect = this.getBoundingClientRect();
		const percent = calculatePercentage(ev.y, hostRect.top, hostRect.bottom);
		const newPos = (this.connector.itemCount / 100) * percent;

		this.connector.position = Math.max(0, newPos);

		requestAnimationFrame(() => this.handleThumbMousedown(ev));
	}

	protected override render(): unknown {
		return html`
		<s-scroll-thumb id="scroll"
			@mousedown=${this.handleThumbMousedown}
		></s-scroll-thumb>
		`;
	}

	public static override styles = css`
	:host {
		display: block;
		width: 16px;
	}
	s-scroll-thumb {
		position: absolute;
		display: block;
		width: 100%;
		background-color: var(--_infinite-scroller-thumb);
	}
	`;
}
ScrollbarCmp.register();

const isFirefox = /Firefox/u.test(navigator.userAgent);

const calculatePercentage = (
	current: number,
	min: number,
	max: number,
): number => ((current - min) / (max - min)) * 100;
