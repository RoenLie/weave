import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';


@customElement('resize-wrapper')
export class ResizeCmp extends LitElement {

	protected set inset(v: number) {
		this.style.setProperty('inset', `0px ${ v }px`);
	}

	protected onResizeMousedown() {
		const onMousemove = (ev: MouseEvent) => {
			if (!ev.buttons)
				return onMouseup();
			if (ev.x > ((window.innerWidth - (window.innerWidth * 0.10)) / 2))
				return;

			this.inset = ev.x;
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
		<s-resize-handle id="left"
			@mousedown=${ this.onResizeMousedown }
		></s-resize-handle>

		<slot></slot>

		<s-resize-handle id="right"
			@mousedown=${ this.onResizeMousedown }
		></s-resize-handle>
		`;
	}

	public static override styles = [
		css`
		:host {
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
