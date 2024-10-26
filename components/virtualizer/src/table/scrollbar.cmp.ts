import { debounce } from '@roenlie/core/timing';
import { queryId, watch } from '@roenlie/lit-utilities/decorators';
import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html } from 'lit';
import { eventOptions, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { getPath } from '../utilities/get-path.js';


export type Placement = 'start' | 'end';
export type Direction = 'vertical' | 'horizontal';


@customElement('mm-virtual-scrollbar')
export class MMVirtualScrollbar extends MimicElement {

	@property({ type: Object })
	public widthResizeRef: HTMLElement | Promise<HTMLElement>;

	@property({ type: Object })
	public reference?: HTMLElement | Promise<HTMLElement | undefined>;

	@property({ attribute: 'default-scroll' })
	public defaultScroll: Direction = 'vertical';

	@property() public placement: Placement = 'end';
	@property() public direction: Direction = 'horizontal';

	@state() protected resolvedRef?:                   HTMLElement;
	@state() protected show = false;
	@queryId('scrollbar') protected scrollbarEl:       HTMLElement;
	@queryId('scrollbar-wrapper') protected wrapperEl: HTMLElement;

	protected isChild = false;
	protected resetScrollOrigin = debounce(() => this.scrollOrigin = undefined, 50);
	protected scrollOrigin?:             'reference' | 'scrollbar' = undefined;
	protected unlistenReference?:        () => void;
	protected unlistenWidthResizeRef?:   () => void;
	protected unlistenHorizontalScroll?: () => void;

	protected readonly resizeObs = new ResizeObserver(([ entry ]) => {
		entry && this.updateHeight();
	});

	public override disconnectedCallback() {
		super.disconnectedCallback();
		this.unlistenReference?.();
		this.unlistenHorizontalScroll?.();
		this.resizeObs.disconnect();
	}

	@watch('reference') protected async onReference() {
		if (!this.reference)
			return;

		this.resolvedRef = this.reference instanceof Promise
			? await this.reference
			: this.reference;

		const ref = this.resolvedRef;
		const path = getPath(this);
		this.isChild = path.some(el => el === ref);

		this.unlistenReference?.();
		this.resizeObs.disconnect();
		this.resizeObs.observe(this.resolvedRef);

		if (this.widthResizeRef) {
			const widthResizeRef = this.widthResizeRef instanceof Promise
				? await this.widthResizeRef
				: this.widthResizeRef;

			this.resizeObs.observe(widthResizeRef);
		}

		const pointerMoveListener = (ev: PointerEvent) => {
			const path = ev.composedPath();
			const pathHasReference = path.some(el => el === ref);
			if (!pathHasReference) {
				globalThis.removeEventListener('pointermove', pointerMoveListener);
				this.show = false;

				return;
			}

			this.show = true;
		};

		const pointerEnterListener = () => {
			globalThis.removeEventListener('pointermove', pointerMoveListener);
			globalThis.addEventListener('pointermove', pointerMoveListener);
		};

		const scrollListener = () => {
			if (this.scrollOrigin === 'scrollbar')
				return;

			this.scrollOrigin = 'reference';
			this.resetScrollOrigin();

			const scrollbar = this.wrapperEl;
			const ref = this.resolvedRef;
			if (!scrollbar || !ref)
				return;

			const scrollbarHeight = ref.scrollHeight - ref.offsetHeight;
			const scrollbarHPercent = ref.scrollTop / scrollbarHeight * 100;
			const localHeight = scrollbar.scrollHeight - scrollbar.offsetHeight;
			const localTop = localHeight / 100 * scrollbarHPercent;

			scrollbar.scrollTop = localTop;

			const scrollbarWidth = ref.scrollWidth - ref.offsetWidth;
			const scrollbarWPercent = ref.scrollLeft / scrollbarWidth * 100;
			const localWidth = scrollbar.scrollWidth - scrollbar.offsetWidth;
			const localLeft = localWidth / 100 * scrollbarWPercent;

			scrollbar.scrollLeft = localLeft;

			this.syncScrollHandlePosition();
		};

		ref.addEventListener('scroll', scrollListener);
		ref.addEventListener('pointerenter', pointerEnterListener);

		this.unlistenReference = () => {
			ref.removeEventListener('scroll', scrollListener);
			ref.removeEventListener('pointerenter', pointerEnterListener);
			ref.removeEventListener('pointermove', pointerMoveListener);
		};

		if (!ref.querySelector('#scroll-removal')) {
			const scrollRemoval = document.createElement('style');
			scrollRemoval.id = 'scroll-removal';
			scrollRemoval.innerHTML = `
			${ ref.tagName.toLowerCase() }::-webkit-scrollbar {
				display: none;
			}
			`;

			ref.appendChild(scrollRemoval);
		}

		if (this.defaultScroll === 'horizontal') {
			this.unlistenHorizontalScroll?.();

			const listener = (ev: WheelEvent) => {
				if (this.direction === 'vertical')
					return;

				const wrapper = this.wrapperEl;
				if (wrapper) {
					ev.preventDefault();
					wrapper.scrollLeft += ev.deltaY;
				}
			};

			ref.addEventListener('wheel', listener);
			this.unlistenHorizontalScroll = () => {
				ref.removeEventListener('wheel', listener);
			};
		}
	}

	@eventOptions({ passive: true })
	protected onScrollbarScroll() {
		if (this.scrollOrigin === 'reference')
			return;

		this.scrollOrigin = 'scrollbar';
		this.resetScrollOrigin();

		const scrollbar = this.wrapperEl;
		if (!scrollbar || !this.resolvedRef)
			return;

		if (this.direction === 'horizontal')
			this.resolvedRef.scrollLeft = scrollbar.scrollLeft;
		if (this.direction === 'vertical')
			this.resolvedRef.scrollTop = scrollbar.scrollTop;

		this.syncScrollHandlePosition();
	}

	protected syncScrollHandlePosition() {
		const bar = this.wrapperEl;
		const reference = this.resolvedRef;
		if (!this.isChild || !reference || !bar)
			return;

		const x = (reference?.scrollLeft ?? 0) + 'px';
		const y = (reference?.scrollTop ?? 0) + 'px';
		bar.style.translate = x + ' ' + y;
	}

	public updateHeight() {
		const reference = this.resolvedRef;
		const wrapper = this.wrapperEl;
		const scrollbar = this.scrollbarEl;
		if (!reference || !wrapper || !scrollbar)
			return;

		if (this.direction === 'vertical') {
			// Think this is not needed.
			//wrapper.style.height = (reference?.clientHeight ?? 0) + 'px';
			const scrollHeight = reference?.scrollHeight ?? 0;
			const diff = reference.offsetHeight - reference.clientHeight + 1;
			scrollbar.style.height = Math.max(0, scrollHeight - diff) + 'px';
		}

		if (this.direction === 'horizontal') {
			// Think this is not needed.
			//wrapper.style.width = (reference?.clientWidth ?? 0) + 'px';
			const scrollWidth = reference?.scrollWidth ?? 0;
			const diff = reference.offsetWidth - reference.clientWidth + 1;
			scrollbar.style.width = Math.max(0, scrollWidth - diff) + 'px';
		}
	}

	protected override render() {
		return html`
		<s-scrollbar-wrapper
			id="scrollbar-wrapper"
			part="wrapper"
			class=${ classMap({
				show:             this.show,
				[this.direction]: true,
				[this.placement]: true,
			}) }
			@scroll=${ this.onScrollbarScroll }
			@mousedown=${ (ev: Event) => ev.preventDefault() }
		>
			<s-scrollbar id="scrollbar" part="scrollbar"
			></s-scrollbar>
		</s-scrollbar-wrapper>
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			--_vscroll-size: var(--vscroll-size, 6px);
			--_vscroll-background: var(--vscroll-background, rgb(0 0 0 / 50%));
			position: relative;
			display: contents;
		}
		:host([direction="vertical"]) s-scrollbar-wrapper {
			overflow-x: hidden;
			overflow-y: scroll;
		}
		:host([direction="vertical"]) s-scrollbar {
			width: 0.1px;
		}
		s-scrollbar-wrapper {
			cursor: grab;
			display: block;
			position: absolute;
			overflow-x: scroll;
			opacity: 0;
			transition: opacity 0.2s ease-out;
		}
		s-scrollbar-wrapper.show,
		s-scrollbar-wrapper:hover {
			opacity: 1;
		}
		s-scrollbar-wrapper:active {
			cursor: grabbing;
		}
		s-scrollbar-wrapper::-webkit-scrollbar {
			width: var(--_vscroll-size);
			height: var(--_vscroll-size);
		}
		s-scrollbar-wrapper::-webkit-scrollbar-thumb {
			border-radius: 1px;
			background: var(--_vscroll-background);
		}
		s-scrollbar {
			display: block;
			height: 0.1px;
		}
		.vertical {
			top: 0;
			bottom: 0;
		}
		.vertical.start {
			left: 0;
		}
		.vertical.end {
			right: 0;
		}
		.horizontal {
			left: 0;
			right: 0;
		}
		.horizontal.start {
			top: 0;
		}
		.horizontal.end {
			bottom: 0;
		}
		`,
	];

}
