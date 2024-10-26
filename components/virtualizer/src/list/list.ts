import { css, type CSSResultGroup, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';


/**
 * Virtual list abstract component class.
 * Enables the rendering of large lists of data with minimal DOM nodes.
 */
export abstract class FragmentList extends LitElement {

	protected abstract renderItem(item: Record<string, any>, index: number): unknown;

	@property({ type: Number }) public itemBuffer = 10;
	@property({ type: Number }) public itemHeight = 72;
	@property({ type: Array }) public items: Record<string, any>[] = [];

	public set position(index: number) {
		this.scrollTop = Math.max(0, Math.min(this.items.length, index))
			* this.itemHeight;
	}

	public get position() {
		return Math.floor(this.scrollTop / this.itemHeight);
	}

	public get visibleRows() {
		return Math.floor(this.getBoundingClientRect().height / this.itemHeight);
	}

	protected readonly itemRange: Record<string, any>[] = [];
	protected topTrigger = 0;
	protected botTrigger = 0;

	public override connectedCallback() {
		super.connectedCallback();

		this.scrollHandler = this.onScroll.bind(this);
		this.addEventListener('scroll', this.scrollHandler, { passive: true });

		this.updateDisplayedItems();
	}

	public override disconnectedCallback() {
		if (this.scrollHandler)
			this.removeEventListener('scroll', this.scrollHandler);
	}

	protected scrollHandler?: EventListener;
	protected onScroll() {
		const hitTop = this.topTrigger > 0
			&& this.position - 5 <= this.topTrigger;

		const hitBot = this.botTrigger < this.items.length
			&& (this.position + this.visibleRows + 5) >= this.botTrigger;

		if (hitTop || hitBot)
			this.updateDisplayedItems();
	}

	protected updateItemRange() {
		// Update top index
		const topIndex = Math.max(0, this.position - this.itemBuffer);
		this.topTrigger = topIndex;

		// Update bot index
		const botIndex = this.position + this.visibleRows + this.itemBuffer + 1;
		this.botTrigger = Math.max(Math.min(botIndex, this.items.length), 0);

		this.itemRange.length = 0;

		if (this.botTrigger - this.topTrigger > 0) {
			for (let i = this.topTrigger; i < this.botTrigger; i++)
				this.itemRange.push(this.items[i]!);
		}
	}

	public updateDisplayedItems() {
		this.updateItemRange();
		this.requestUpdate();
	}

	protected override render() {
		return html`
		<style>
			:host {
				--_full-height: ${ this.itemHeight * this.items.length }px;
				--_viewport_y: ${ this.topTrigger * this.itemHeight }px;
				--_row-height: ${ this.itemHeight }px;
			}
		</style>

		<div id="full-height"></div>
		<s-list>
			${ map(this.itemRange, (_, i) => {
				const index = i + this.topTrigger;

				return html`
				<s-row index=${ index }>
					${ this.renderItem(this.items[index]!, index) }
				</s-row>
				`;
			}) }
		</s-list>
		`;
	}

	public static override styles: CSSResultGroup = css`
		:host {
			contain: strict;
			overflow: auto;
			display: block;
		}
		#full-height {
			pointer-events: none;
			user-select: none;
			visibility: hidden;
			height: var(--_full-height);
		}
		s-list {
			position: absolute;
			inset: 0px;
			bottom: unset;
			display: grid;
			grid-auto-flow: row;
			grid-auto-rows: max-content;
			will-change: translate;
			translate: 0px var(--_viewport_y);
		}
		s-row {
			pointer-events: none;
			contain: strict;
			display: grid;
			height: var(--_row-height);
			&> * {
				pointer-events: auto;
			}
		}
	`;

}
