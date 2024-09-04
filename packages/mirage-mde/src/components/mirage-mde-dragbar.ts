import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('mirage-mde-dragbar')
export class DragbarElement extends LitElement {

	protected override render() {
		return html`
		<div class="draghandle"></div>
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
