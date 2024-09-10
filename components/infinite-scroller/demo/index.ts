import { css, html, LitElement, render } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { InfiniteScroller } from '../src/index.js';


@customElement('m-handover-list')
export class HandoverListCmp extends LitElement {


	@query('m-handover-row-scroller') protected scrollerEl: HandoverRowScrollerCmp;
	protected resizeObs = new ResizeObserver(([ entry ]) => {
		const scroller = this.scrollerEl;
		if (!entry || !scroller)
			return;

		const availableSize = this.offsetHeight;
		const visibleCount = Math.ceil(availableSize / 60);

		if (visibleCount !== scroller.bufferSize)
			scroller.bufferSize = visibleCount;
	});

	public override connectedCallback(): void {
		super.connectedCallback();

		this.resizeObs.observe(this);

		this.updateComplete.then(() => this.afterConnectedCallback());
	}

	public afterConnectedCallback(): void {
		const availableSize = this.offsetHeight;
		const visibleCount = Math.ceil(availableSize / 60);

		this.scrollerEl.bufferSize = visibleCount;
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
	protected override maxIndex = 10000;

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

	public static override styles = [
		InfiniteScroller.styles,
		css`
		`,
	];

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
