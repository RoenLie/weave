import { type Fn, Deferred, emitEvent, invariant } from '@eyeshare/shared';
import { componentStyles, drag, EventController } from '@eyeshare/web-components';
import { computePosition } from '@floating-ui/dom';
import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { ContentController } from './content-controller.js';
import { MiContentReferencerCmp } from './content-referencer.cmp.js';

/* ------------------------------------------------- */

type Vector2D = {x: number; y: number};

/* ------------------------------------------------- */

@customElement('mi-content-window')
export class MiContentWindowCmp extends LitElement {

	//#region properties
	@property({ type: Object }) public referenceEvent?: PointerEvent;

	protected pointerPosition: Vector2D;

	protected pointerOffset: Vector2D;

	protected positionerSub: {unsubscribe: Fn};

	protected virtualEl = {
		getBoundingClientRect: () => {
			return {
				width:  0,
				height: 0,
				x:      this.pointerPosition.x,
				y:      this.pointerPosition.y,
				top:    this.pointerPosition.y,
				left:   this.pointerPosition.x,
				right:  this.pointerPosition.x,
				bottom: this.pointerPosition.y,
			};
		},
	};
	//#endregion


	//#region controllers
	protected readonly eventCtrl = new EventController({ host: this });
	protected readonly contentCtrl = new ContentController({ host: this });
	//#endregion


	//#region lifecycle
	public override connectedCallback() {
		super.connectedCallback();
	}

	protected override firstUpdated(props: PropertyValues) {
		super.firstUpdated(props);

		if (this.referenceEvent) {
			if (this.referenceEvent.buttons > 0) {
				const moverEl  = this.renderRoot.querySelector<HTMLElement>('.mover')!;
				const moverRects = moverEl.getBoundingClientRect();

				this.pointerOffset = {
					x: -(moverRects.width / 2),
					y: 0,
					//y: -(moverRects.height / 2),
				};

				this.startPositioner(this.referenceEvent, false);
			}
		}
	}
	//#endregion


	//#region logic
	protected startPositioner(ev: PointerEvent, calculcateOffset = true) {
		ev.preventDefault();
		this.stopPositioner();

		const moverEl = this.renderRoot.querySelector('.mover');
		invariant(moverEl);

		this.style.setProperty('pointer-events', 'none');

		const floatingRects = moverEl.getBoundingClientRect();
		const containerRects = window.document.body.getBoundingClientRect();

		if (calculcateOffset) {
			const styles = getComputedStyle(this);

			const widthExtras = {
				pad:    styles.paddingLeft,
				margin: styles.marginLeft,
				border: styles.borderLeftWidth,
			};

			const heightExtras = {
				pad:    styles.paddingTop,
				margin: styles.marginTop,
				border: styles.borderTopWidth,
			};

			const sum = (obj: Record<string, string>) =>
				Object.values(obj).reduce((a, b) => a + parseInt(b), 0);

			const extraWidth = sum(widthExtras);
			const extraHeight = sum(heightExtras);

			this.pointerOffset = {
				x: floatingRects.left - ev.clientX - extraWidth,
				y: floatingRects.top - ev.clientY - extraHeight,
			};
		}

		this.positionerSub = drag(window.document.body, {
			initialEvent: ev,
			onMove:       ({ x, y }) => {
				this.pointerPosition = { x, y };

				computePosition(this.virtualEl, this, {
					placement: 'bottom-start',
					strategy:  'fixed',
				}).then(({ x, y }) => {
					x += this.pointerOffset.x;
					y += this.pointerOffset.y;

					/* check upper boundry constraints */
					if (x + floatingRects.width > containerRects.right)
						x = containerRects.right - floatingRects.width;
					if (y + floatingRects.height > containerRects.bottom)
						y = containerRects.bottom - floatingRects.height;

					/* check lower boundry constraints */
					if (x < containerRects.left)
						x = containerRects.left;
					if (y < containerRects.top)
						y = containerRects.top;

					Object.assign(this.style, {
						top:       '0',
						left:      '0',
						transform: `translate(${ Math.round(x) }px,${ Math.round(y) }px)`,
					});
				});
			},
			onStop: ({ event }) => {
				this.stopPositioner();

				const path = Array.from(event.composedPath()) as HTMLElement[];
				const dropzone = path.find(
					el => el instanceof MiContentReferencerCmp,
				) as MiContentReferencerCmp | undefined;

				if (dropzone) {
					const id = this.querySelector('mi-content')?.id;
					if (!id)
						return;

					this.contentCtrl.closeWindow(id, dropzone.category);
				}
			},
		});
	}

	protected stopPositioner() {
		this.style.removeProperty('pointer-events');
		this.positionerSub?.unsubscribe();
	}
	//#endregion


	//#region template
	public override render() {
		return html`
		<div class="mover" @pointerdown=${ this.startPositioner }>
		</div>

		<slot></slot>
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		componentStyles,
		css`
		:host {
			border: 3px solid black;
			position: fixed;
			display: grid;
			grid-template-rows: 50px 1fr;
			height: 300px;
			width: 300px;
			background-color: var(--surface-variant);
			color: var(--on-surface);
			z-index: 1;
		}
		.mover {
			border-bottom: 3px solid black;
			cursor: grab;
		}
		`,
	];
	//#endregion


}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-content-window': MiContentWindowCmp;
	}
}
