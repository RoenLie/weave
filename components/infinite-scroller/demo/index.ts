import { css, html, LitElement, render } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { InfiniteScroller } from '../src/infinite-scroller.ts';


@customElement('m-handover-list')
export class HandoverRowScrollerCmp extends InfiniteScroller {

	//protected override maxIndex = 5000;
	protected override maxIndex = 500;
	//protected override maxIndex = 50;
	//protected override maxIndex = 5;
	//protected override maxIndex = 0;

	protected override createElement(): HTMLElement {
		return document.createElement('m-handover-row');
	}

	protected override updateElement(
		element: HandoverRowCmp,
		index: number,
	): void {
		if (index < 0 || index >= this.maxIndex) {
			element.style.setProperty('visibility', 'hidden');
			element.value = '';
		}
		else {
			element.style.setProperty('visibility', '');
			element.value = String(index);
		}
	}

	protected override onScroll(): void {
		super.onScroll();

		if ((this.maxIndex - this.position) < 30)
			this.maxIndex += 50;
	}

	public static override styles = css`
	:host {
		margin-block: 50px;
		border-block: 1px solid pink;
	}
	`;

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
