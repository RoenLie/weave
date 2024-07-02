import { drag } from '@roenlie/mimic-core/dom';
import { css, html, LitElement, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';


@customElement('mirage-mde-dragbar')
export class DragbarElement extends LitElement {

	@property({ type: Object, attribute: false })
	public handledrag: {
		orientation: Parameters<DragbarElement['createDragHandler']>[0],
		host: HTMLElement,
		wrapperQry: () => HTMLElement,
		elementQry: () => HTMLElement,
		onStop?: (width: number) => void,
		onExpand?: (width: number) => void,
		onCollapse?: (width: number) => void,
	};

	protected handler: (ev: PointerEvent) => void;
	protected sub?: ReturnType<typeof drag>;

	protected override willUpdate(props: PropertyValues) {
		super.willUpdate(props);

		if (props.has('handledrag')) {
			this.handler = (ev: PointerEvent) => this.createDragHandler(
				this.handledrag.orientation,
				ev,
				this.handledrag.host,
				sub => this.sub = sub,
				() => this,
				this.handledrag.wrapperQry,
				this.handledrag.elementQry,
				this.handledrag.onCollapse,
				this.handledrag.onExpand,
				this.handledrag.onStop,
			);
		}
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();

		this.sub?.unsubscribe();
	}

	protected createDragHandler(
		orientation: 'left' | 'right',
		initialEvent: PointerEvent,
		host: HTMLElement,
		subSetter: (sub: ReturnType<typeof drag>) => void,
		dragbarQry: () => HTMLElement,
		wrapperQry: () => HTMLElement,
		elementQry: () => HTMLElement,
		onCollapse?: (width: number) => void,
		onExpand?: (width: number) => void,
		onStop?: (width: number) => void,
	) {
		const dragbarRect = dragbarQry().getBoundingClientRect();
		const offset = dragbarRect.left - initialEvent.x;

		const wrapperEl = wrapperQry();
		let wrapperRect = wrapperEl.getBoundingClientRect();

		const targetEl = elementQry();
		let minWidth = targetEl
			? Number(getComputedStyle(targetEl).minWidth.replace('px', ''))
			: undefined;

		let newWidth = 0;

		const unsub = drag(host, {
			onMove: ({ event }) => {
				event.preventDefault();

				wrapperRect = wrapperEl.getBoundingClientRect();
				newWidth = orientation === 'left'
					? Math.abs(event.x - wrapperRect.left) + offset
					: Math.abs(event.x - wrapperRect.right) + offset;

				if (!minWidth || isNaN(minWidth))
					minWidth = 0;

				if (newWidth > minWidth) {
					targetEl.style.setProperty('width', newWidth + 'px');
					onExpand?.(newWidth);
				}
				else if (newWidth < minWidth - 20) {
					onCollapse?.(newWidth);
				}
			},
			onStop: () => void onStop?.(newWidth),
		});

		subSetter(unsub);
	}

	protected override render() {
		return html`
		<div class="draghandle" @pointerdown=${ this.handler }></div>
		`;
	}

	public static override styles = css`
	:host {
		position: relative;
	}
	.draghandle {
		position: absolute;
		height: 100%;
		width: 4px;
		left: -2px;
		background-color: var(--_mmde-scrollthumb);
		z-index: 999;
		cursor: ew-resize;
		opacity: 0;
		transition: opacity 0.2s linear;
	}
	.draghandle:hover {
		opacity: 1;
	}
	`;

}


declare global {
	interface HTMLElementTagNameMap {
		'mirage-mde-dragbar': DragbarElement;
	}
}
