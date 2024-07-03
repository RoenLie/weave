import { paintCycle } from '@roenlie/core/async';
import { findActiveElement, getTabbableBoundary } from '@roenlie/core/dom';
import { noop } from '@roenlie/core/function';
import { typeOf } from '@roenlie/core/validation';
import { EventController, KeyboardController } from '@roenlie/lit-utilities/controllers';
import { css, html, LitElement, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

import { componentStyles } from '../../../features/shared-styles/component-styles.js';
import { tooltip } from '../../tooltip/tooltip.directive.js';
import type { Coordinate, Coordinates, IConstraints } from '../controllers/controller.types.js';
import { DisplacementController } from '../controllers/displacement.controller.js';
import { MoveController } from '../controllers/move.controller.js';
import { ResizeController } from '../controllers/resize.controller.js';
import { DialogBackgroundCmp } from './dialog-background.cmp.js';
import { DialogPortalCmp } from './dialog-portal.cmp.js';


@customElement('pl-dialog')
export class DialogCmp extends LitElement {

	//#region state
	@property({ type: Object }) public constraints?: IConstraints;
	@property({ type: Array }) public initialXY?: Coordinates;
	@property({ type: String }) public initialWidth = '50%';
	@property({ type: String }) public initialHeight = '50%';
	@property({ type: Boolean, reflect: true }) public moveable: boolean;
	@property({ type: Boolean, reflect: true }) public resizable: boolean;
	@property({ type: Boolean, reflect: true }) public maximizable: boolean;
	@property({ type: Boolean, reflect: true }) public displaceable: boolean;
	@property({ type: Boolean, reflect: true }) public cancellable: boolean;
	@property({ type: Object }) public renderFn: (element: DialogCmp) => TemplateResult = noop(html``);
	@property({ type: Object }) public closeFn?: () => void;
	@property({ type: Object }) public portal: DialogPortalCmp;
	//#endregion state


	//#region properties
	protected thisXY: readonly [string, string];
	protected previousSettings: {
		margin:       string;
		inset:        string;
		height:       string;
		width:        string;
		top:          string;
		left:         string;
		moveable:     boolean;
		resizable:    boolean;
		displaceable: boolean;
	} | null = null;

	protected trapFocus = false;
	//#endregion properties


	//#region lifecycle
	public override connectedCallback() {
		super.connectedCallback();
		this.tabIndex = -1;

		this.constraints ??= {
			x: [ 0, () => window.innerWidth ],
			y: [ 0, () => window.innerHeight ],
		};

		this.updateComplete.then(() => this.reset());

		paintCycle().then(() => {
			const content = this.renderRoot.querySelector<HTMLElement>('.content');
			if (content) {
				window.setTimeout(() => {
					const focusBoundry = getTabbableBoundary(content);
					const first = focusBoundry.start;
					first ? first.focus() : this.focus();
				});
			}
		});
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();

		const lastDialogInPortal = [ ...this.portal?.renderRoot.querySelectorAll('pl-dialog') ?? [] ]?.at(-1);
		lastDialogInPortal?.focus();
	}
	//#endregion lifecycle


	//#region logic
	protected onDlbClickMover = (ev: MouseEvent) => {
		if (!this.maximizable)
			return;

		ev.preventDefault();
		this.previousSettings ? this.restore() : this.maximize();
	};

	protected getPositionXY = async () => {
		if (this.thisXY)
			return this.thisXY;

		await this.reset();

		return this.thisXY;
	};

	protected setPositionXY = (v: readonly [x: string, y: string]) => {
		this.thisXY = v;

		this.style.removeProperty('transform');
		Object.assign(this.style, {
			margin: '',
			inset:  '',
			left:   v[0],
			top:    v[1],
		});
	};

	protected setTransformXY = (v: readonly [x: number, y: number]) => {
		Object.assign(this.style, {
			margin:    '',
			inset:     '',
			transform: 'translate(' + v[0] + 'px,' + v[1] + 'px)',
			top:       '0px',
			left:      '0px',
		});
	};

	protected setSize = (size: readonly [width: string, height: string]) => {
		Object.assign(this.style, {
			width:  size[0],
			height: size[1],
		});
	};

	protected setPreviousSettings = () => {
		this.previousSettings = {
			margin:       this.style.margin,
			inset:        this.style.inset,
			height:       this.style.height,
			width:        this.style.width,
			top:          this.style.top,
			left:         this.style.left,
			moveable:     this.moveable,
			resizable:    this.resizable,
			displaceable: this.displaceable,
		};
	};

	protected reset = async () => {
		this.setSize([ this.initialWidth, this.initialHeight ]);

		// In order to support calculating the initial positioning from the offsets when
		// initialWidth/initialHeight is 'auto' we must allow the render engine to lay out the content.
		await paintCycle();

		let stylesToApply: Partial<CSSStyleDeclaration> = {};
		let [ initialX, initialY ] = this.initialXY ?? [];

		// Sets the initial X and Y in case of invalid inital coordinates.
		const isValidCoordinate = (c: Coordinate) => typeof c === 'number' && Number.isFinite(c) || !!c;
		const invalidX = !isValidCoordinate(initialX);
		const invalidY = !isValidCoordinate(initialY);

		const left = typeOf(initialX).number() ? initialX + 'px' : initialX as string;
		const top = typeOf(initialY).number() ? initialY + 'px' : initialY as string;

		if (invalidX && invalidY) {
			stylesToApply.margin = 'auto';
			stylesToApply.inset = '0';
		}
		else if (invalidX) {
			stylesToApply.margin = 'auto';
			stylesToApply.left = '0';
			stylesToApply.right = '0';
			stylesToApply.top = top;
		}
		else if (invalidY) {
			stylesToApply.margin = 'auto';
			stylesToApply.top = '0';
			stylesToApply.bottom = '0';
			stylesToApply.left = left;
		}
		else {
			stylesToApply.left = left;
			stylesToApply.top = top;
		}

		Object.assign(this.style, stylesToApply);

		this.classList.add('active');

		const rects = this.getBoundingClientRect();

		return (this.thisXY = [ rects.x + 'px', rects.y + 'px' ]);
	};

	protected async maximize() {
		this.setPreviousSettings();

		this.style.removeProperty('max-width');
		this.style.removeProperty('max-height');
		this.style.removeProperty('transform');

		this.setSize([ '100%', '100%' ]);
		this.setPositionXY([ '0px', '0px' ]);

		this.moveable = false;
		this.resizable = false;
		this.displaceable = false;

		this.requestUpdate();

		await this.updateComplete;
		this.focus();
	}

	protected async restore() {
		if (!this.previousSettings)
			return;

		this.setSize([ this.previousSettings.width!, this.previousSettings.height! ]);

		if (this.previousSettings.margin) {
			Object.assign(this.style, {
				margin: this.previousSettings.margin,
				inset:  this.previousSettings.inset,
			});
		}
		else {
			this.setPositionXY([
				this.previousSettings.left!,
				this.previousSettings.top!,
			]);
		}

		this.moveable = this.previousSettings.moveable;
		this.resizable = this.previousSettings.resizable;
		this.displaceable = this.previousSettings.displaceable;
		this.previousSettings = null;

		this._displaceController.windowResize();
		this.requestUpdate();

		await this.updateComplete;
		this.focus();
	}
	//#endregion logic


	//#region controllers
	protected readonly eventCtrl = new EventController({
		host:      this,
		listeners: [
			{
				target:   this,
				type:     'focusin',
				listener: (_ev) => this.trapFocus = true,
			},
			{
				target:   this,
				type:     'focusout',
				listener: (_ev) => this.trapFocus = false,
			},
			{
				target:   window,
				type:     'pointerdown',
				listener: (ev) => {
					const path = [ ...ev.composedPath() ] as HTMLElement[];
					if (!path.some(el => el instanceof DialogCmp) &&
						path.some(el => el instanceof DialogBackgroundCmp && el.type === 'modal')
					) {
						ev.preventDefault();
						this.focus();
					}
				},
			},
		],
	});

	protected readonly keyboardCtrl = new KeyboardController({
		host:    this,
		target:  window,
		keylist: [
			{
				key:       'tab',
				modifiers: [ [ 'shift' ], [] ],
				eventType: 'keydown',
				listener:  (ev) => {
					if (!this.trapFocus)
						return;

					const boundry = getTabbableBoundary(this);
					// Since trapFocus is true, we know that focus is either the dialog boundary
					// or some of its content. By excluding self, currentActive===null means
					// focus is on the boundary.
					const currentActive = findActiveElement(this, false);

					const direction = ev.shiftKey ? 'backwards' : 'forwards';
					if (direction === 'forwards' && currentActive === boundry.end)
						ev.preventDefault();
					if (direction === 'backwards' && (currentActive === boundry.start || currentActive === null))
						ev.preventDefault();
				},
			},
			{
				key:       'escape',
				eventType: 'keydown',
				listener:  (ev) => {
					if (!this.cancellable || !this.closeFn || !this.trapFocus)
						return;

					ev.preventDefault();
					this.closeFn();
				},
			},
			{
				key:       [ 'arrowup' ],
				modifiers: [ [ 'alt' ] ],
				eventType: 'keydown',
				listener:  (ev) => {
					if (!this.maximizable || !this.trapFocus)
						return;

					this.maximize();
					ev.preventDefault();
				},
			},
			{
				key:       [ 'arrowdown' ],
				modifiers: [ [ 'alt' ] ],
				eventType: 'keydown',
				listener:  (ev) => {
					if (!this.maximizable || !this.trapFocus)
						return;

					this.restore();
					ev.preventDefault();
				},
			},
		],
	});

	protected resizeController = new ResizeController(
		this,
		() => this.constraints!,
		this.getPositionXY,
	);

	protected _displaceController = new DisplacementController(
		this,
		() => this.constraints!,
		this.setPositionXY,
		this.setSize,
	);

	protected _moveController = new MoveController(
		this,
		() => this.constraints!,
		this.setPositionXY,
		this.setTransformXY,
	);
	//#endregion controllers


	//#region template
	protected override render() {
		return html`
		<section class="header" @dblclick=${ this.onDlbClickMover }>
			<div class="mover"
				@mousedown=${ this?._moveController?.startMoveDialog }
			></div>
			${ when(this.maximizable && this.previousSettings, () => html`
				<button
					class="icon"
					@click=${ this.restore }
					${ tooltip('restore') }
				>
					<pl-boot-icon
						icon="fullscreen-exit"
					></pl-boot-icon>
				</button>
				`, () => when(this.maximizable, () => html`
				<button
					class="icon"
					@click=${ this.maximize }
					${ tooltip('maximize') }
				>
					<pl-boot-icon
						icon="fullscreen"
					></pl-boot-icon>
				</button>
				`))
			}
			${ when(this.cancellable && this.closeFn, () => html`
				<button
					class="icon"
					@click=${ () => this.closeFn!() }
					${ tooltip('close') }
				>
					<pl-boot-icon
						icon="x-lg"
					></pl-boot-icon>
				</button>
				`)
			}
		</section>

		<section class="content">
			${ this.renderFn(this) }
		</section>

		<section class="footer">
		</section>
		`;
	}
	//#endregion template


	//#region style
	public static override styles = [
		componentStyles,
		css` /* vars */
		:host {
			--scrollbar-height:  0.75rem;
			--scrollbar-width:   0.75rem;
			--scrollbar-track:   var(--surface);
			--scrollbar-thumb:   var(--surface-variant);
			--border-radius:     var(--border-radius-xs);
			--border:            1px solid var(--surface-variant);
			--bg-color:          var(--surface);
			--txt-color:         var(--on-surface);
			--icon-color:        var(--on-surface);
			--box-shadow:        0px 1px 4px rgba(0, 0, 0, 0.60);
		}
		`,
		css` /* host */
		:host {
			transition:          opacity 0.2s linear;
			position:            fixed;
			overflow:            auto;
			visibility:          hidden;
			display:             grid;
			grid-template-rows:  minmax(1rem, auto) 1fr auto;
			border:              var(--border);
			border-radius:       var(--border-radius);
			box-shadow:          var(--box-shadow);
			min-height:          5rem;
			min-width:           5rem;
			color:               var(--txt-color);
			background-color:    var(--bg-color);
			outline: none;
		}
		:host(:focus-visible) {
			outline: 3px solid;
			outline-offset: 3px;
			outline-color: var(--focus-primary-0-color);
			transition: all var(--transition-fast) ease-out;
		}

		:host(.moveable) .header .mover {
			cursor:   move;
			position: relative;
			width:    100%;
			height:   100%;
		}

		:host(.active) {
			visibility: visible;
		}

		:host(.resizable) {
			resize:   both;
			overflow: auto;
		}
		`,
		css`
		.spritesheet {
			display: none;
		}

		button.icon {
			opacity:     0.5;
			margin:      0;
			padding:     0;
			border:      none;
			outline:     none;
			background:  none;
			display:     grid;
			place-items: center;
			color:       var(--txt-color);
			transition:  opacity 0.2s linear;
			cursor:      pointer;
		}
		button.icon svg {
			width:  1rem;
			height: 1rem;
		}

		@media (pointer: fine) {
			button.icon:hover {
				color:   var(--icon-color);
				opacity: 1;
			}
		}

		.header {
			display:         flex;
			justify-content: flex-end;
			gap:             4px;
			padding:         4px;
		}

		.content {
			display:  grid;
			overflow: auto;
			padding:  4px 4px 6px 4px;
   	}
      .content::-webkit-scrollbar {
         width:      var(--scrollbar-height);
         height:     var(--scrollbar-width);
      }
      .content::-webkit-scrollbar-track {
         background: var(--scrollbar-track);
      }
      .content::-webkit-scrollbar-thumb {
         background: var(--scrollbar-thumb);
      }
      .content::-webkit-scrollbar-corner {
         background: var(--scrollbar-track);
      }

		.footer {
			display:         flex;
			justify-content: flex-start;
   	}
	`,
	];
	//#endregion style

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-dialog': DialogCmp;
	}
}
