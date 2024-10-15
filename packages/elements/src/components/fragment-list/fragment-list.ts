import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { intersect } from '../fragment-table/intersect-directive.ts';
import { map } from 'lit/directives/map.js';
import { throttle, withDebounce } from '@roenlie/core/timing';


export abstract class FragmentList extends LitElement {

	protected abstract renderRow(data: Record<string, any>, index: number): unknown;

	@property({ type: Number }) public rowBuffer = 10;
	@property({ type: Number }) public rowHeight = 64;
	@property({ type: Array }) public data: Record<string, any>[] = [];

	public set position(index: number) {
		this.scrollTop = Math.max(0, Math.min(this.data.length, index))
			* this.rowHeight;
	}

	public get position() {
		return Math.floor(this.scrollTop / this.rowHeight);
	}

	public get visibleRows() {
		return Math.floor(this.getBoundingClientRect().height / this.rowHeight);
	}

	protected readonly dataRange: Record<string, any>[] = [];
	protected topTrigger = 0;
	protected botTrigger = 0;

	public override connectedCallback() {
		super.connectedCallback();

		this.addEventListener('scroll', this.handleScroll, { passive: true });
		this.updateDisplayedData();
	}

	public override disconnectedCallback() {
		this.removeEventListener('scroll', this.handleScroll);
	}

	protected handleScroll = () => {
		const hitTop = this.topTrigger > 0
			&& this.position - 5 <= this.topTrigger;

		const hitBot = this.botTrigger < this.data.length
			&& (this.position + this.visibleRows + 5) >= this.botTrigger;

		if (hitTop || hitBot)
			this.updateDisplayedData();
	};

	protected updateDataRange() {
		// Update top index
		const topIndex = Math.max(0, this.position - this.rowBuffer);
		this.topTrigger = topIndex;

		// Update bot index
		const botIndex = this.position + this.visibleRows + this.rowBuffer + 1;
		this.botTrigger = Math.max(Math.min(botIndex, this.data.length));

		this.dataRange.length = 0;
		for (let i = topIndex; i < botIndex; i++)
			this.dataRange.push(this.data[i]!);
	}

	public updateDisplayedData() {
		this.updateDataRange();
		this.requestUpdate();
	}

	protected override render() {
		return html`
		<style>
			:host {
				--_full-height: ${ this.rowHeight * this.data.length }px;
				--_viewport_y: ${ this.topTrigger * this.rowHeight }px;
				--_row-height: ${ this.rowHeight }px;
			}
		</style>

		<div id="full-height"></div>
		<s-list>
			${ map(this.dataRange, (data, i) => {
				const index = i + this.topTrigger;

				return html`
				<s-row index=${ index }>
					${ this.renderRow(data, index) }
				</s-row>
				`;
			}) }
		</s-list>
		`;
	}

	public static override styles = css`
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
			translate: 0px var(--_viewport_y);
		}
		s-row {
			contain: strict;
			height: var(--_row-height);
		}
	`;

}


@customElement('mm-fragment-list')
export class DemoFragmentList extends FragmentList {

	protected override renderRow(data: Record<string, any>, index: number): unknown {
		return html`
		I AM A CAKE ${ index }
		`;
	}

}
