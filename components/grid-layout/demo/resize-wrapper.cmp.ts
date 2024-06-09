import { LitElement, css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';


@customElement('resize-wrapper')
export class ResizeCmp extends LitElement {

	@query('div', true) protected wrapperEl: HTMLElement;

	protected set inset(v: number) {
		this.wrapperEl.style.setProperty('inset', `0px ${ v }px`);
	}

	protected onResizeMousedown(ev: MouseEvent) {
		const direction = (ev.target as HTMLElement).id as 'left' | 'right';

		const onMousemove = (ev: MouseEvent) => {
			if (!ev.buttons)
				return onMouseup();

			const rect = this.getBoundingClientRect();
			const widthLimit = ((this.offsetWidth - (this.offsetWidth * 0.10)) / 2);
			let width = 0;

			if (direction === 'left')
				width = ev.x - rect.left;
			if (direction === 'right')
				width = rect.right - ev.x;

			this.inset = Math.min(widthLimit, Math.max(0, width));
		};
		const onMouseup = () => {
			window.removeEventListener('mousemove', onMousemove);
			window.removeEventListener('mouseup', onMouseup);
		};

		window.addEventListener('mousemove', onMousemove);
		window.addEventListener('mouseup', onMouseup);
	}

	protected override render() {
		return html`
		<div>
			<s-resize-handle id="left"
				@mousedown=${ this.onResizeMousedown }
			></s-resize-handle>

			<slot></slot>

			<s-resize-handle id="right"
				@mousedown=${ this.onResizeMousedown }
			></s-resize-handle>
		</div>
		`;
	}

	public static override styles = [
		css`
		:host {
			position: relative;
			display: grid;
		}
		div {
			position: absolute;
			inset: 0px;
			display: grid;
			grid-template-columns: max-content 1fr max-content;
		}
		s-resize-handle {
			display: block;
			width: 10px;
			cursor: ew-resize;

			border-inline: 1px solid rgb(80 80 80);
		}
		`,
	];

}
