import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { css, html } from 'lit';

import { sharedStyles } from '../../styles/shared-styles.js';

@customElement('m-drag-handle')
export class DragHandleCmp extends MimicElement {

	protected override render(): unknown {
		return html`
		<s-drag-wrapper>
			<s-drag-handle part="handle"></s-drag-handle>
		</s-drag-wrapper>
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			--_drag-handle: var(--drag-handle, rgba(83, 83, 83, 1));

			container-type: size;
			pointer-events: none;
			display: grid;
		}
		s-drag-wrapper {
			position: relative;
			pointer-events: auto;
			align-self: center;
			justify-self: center;
			display: grid;
			place-items: center;
			height: max-content;
			width: 90%;
			cursor: ns-resize;
			border-radius: 2px;
		}
		s-drag-wrapper:hover {
			background-color: color-mix(in srgb, var(--_drag-handle) 50%, transparent);
		}
		s-drag-handle {
			display: block;
			height: 3px;
			width: 60px;
			background-color: var(--_drag-handle);
			border-radius: 2px;
		}
		@container (orientation: portrait) {
			s-drag-wrapper {
				justify-self: center;
				cursor: ew-resize;
				height: 90%;
				width: max-content;
			}
			s-drag-handle {
				width: 3px;
				height: 60px;
			}
		}
		`,
	];

}
