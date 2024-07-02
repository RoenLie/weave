import { emitEvent } from '@eyeshare/shared';
import { componentStyles, EventController } from '@eyeshare/web-components';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { MiContentCmp } from './content.cmp.js';
import { ContentController } from './content-controller.js';
import type { CategoryKeys } from './content-manager.cmp.js';

/* ------------------------------------------------- */

@customElement('mi-content-referencer')
export class MiContentReferencerCmp extends LitElement {

	//#region properties
	@property({ type: String }) public category: CategoryKeys;

	@property({ type: Object }) public renderFn =
		(content: MiContentCmp) => html`${ content.containedLabel }`;
	//#endregion


	//#region controllers
	protected readonly eventCtrl = new EventController({ host: this });
	protected readonly contentCtrl: ContentController = new ContentController({ host: this });
	//#endregion


	//#region lifecycle
	public override async connectedCallback() {
		super.connectedCallback();
		this.contentCtrl.observeCategory(this.category, () => { this.requestUpdate(); });
	}
	//#endregion


	//#region logic
	protected handleWindowClick(ev: PointerEvent) {
		ev.preventDefault();
		const target = ev.target as HTMLElement;

		const activationIds = [
			this.eventCtrl.addEventListener(target, 'pointerout', (ev: PointerEvent) => {
				this.eventCtrl.removeEventListener(...activationIds);
				this.contentCtrl.openAsWindow(target.id, ev);
			}),

			this.eventCtrl.addEventListener(window, 'pointerup', (ev: PointerEvent) => {
				this.eventCtrl.removeEventListener(...activationIds);

				const target = Array.from(ev.composedPath()).at(0) as HTMLElement;
				emitEvent(this, 'mi-select-content', { detail: { id: target.id } });
			}),
		];
	}
	//#endregion


	//#region template
	public override render() {
		return html`
		<div class="base" part="content-ref-base">
			${ repeat(
				this.contentCtrl.getCategory(this.category),
				(content) => content.element.id,
				(content) => html`
				<div
					id=${ content.element.id }
					class="content-wrapper"
					@pointerdown=${ this.handleWindowClick }
				>
					${ this.renderFn(content.element) }
				</div>
				`,
			) }
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		componentStyles,
		css`
		:host {
			display: block;
		}
		.base {
			display: flex;
			height: 100%;
			gap: 8px;
		}
		.content-wrapper {
			position: relative;
			cursor: grab;
			background-color: var(--surface-variant);
			border-radius: 16px;
			padding: 4px;
			display: grid;
			place-items: center;
		}
		.content-wrapper::after {
			content: '';
			position: absolute;
			inset: 0;
			border-radius: inherit;
			pointer-events: none;
		}
		.content-wrapper:hover::after {
			background-color: var(--surface-variant-hover);
		}
		.content-wrapper:active::after {
			background-color: var(--surface-variant-press);
		}
		`,
	];
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-content-referencer': MiContentReferencerCmp;
	}

	interface HTMLElementEventMap {
		'mi-select-content': CustomEvent<{id: string}>;
	}
}
