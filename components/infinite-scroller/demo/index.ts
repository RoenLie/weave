import { css, html, LitElement, render } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { InfiniteScroller } from '../src/infinite-scroller.ts';


@customElement('m-handover-list')
export class HandoverListCmp extends LitElement {

	@query('m-handover-row-scroller') protected scrollerEl: HandoverRowScrollerCmp;

	public override connectedCallback(): void {
		super.connectedCallback();
	}

	protected override render(): unknown {
		return html`
		<m-handover-row-scroller></m-handover-row-scroller>
		`;
	}

	public static override styles = css`
	:host {
		overflow: hidden;
		display: grid;
	}
	`;

}

@customElement('m-handover-row-scroller')
export class HandoverRowScrollerCmp extends InfiniteScroller {

	protected override minIndex = 0;
	protected override maxIndex = 100;

	protected override createElement(): HTMLElement {
		return document.createElement('m-handover-row');
	}

	protected override updateElement(
		element: HandoverRowCmp,
		index: number,
	): void {
		if (index < this.minIndex || index > this.maxIndex) {
			element.style.setProperty('visibility', 'hidden');
		}
		else {
			element.style.setProperty('visibility', '');
			element.value = String(index);
		}
	}

	protected override onScroll(): void {
		super.onScroll();

		if ((this.maxIndex - this.position) < 20)
			this.maxIndex += 100;
	}

	public static override styles = [];

}

@customElement('m-handover-row')
export class HandoverRowCmp extends LitElement {

	@property() public value = '';

	protected override render(): unknown {
		return html`
	WHAT IS THIS: ${ this.value }
	`;
	}

	public static override styles = [
		css`
		:host {
			border-bottom: 2px solid grey;
		}
		`,
	];

}


render(html`<m-handover-list></m-handover-list>`, document.body);