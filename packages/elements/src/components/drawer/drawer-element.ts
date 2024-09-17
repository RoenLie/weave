import { animateTo, getAnimation, stopAnimations } from '@roenlie/core/animation';
import { emitEvent, findActiveElement, lockBodyScrolling, Modal, unlockBodyScrolling, waitForEvent } from '@roenlie/core/dom';
import { uppercaseFirstLetter } from '@roenlie/core/string';
import { SlotController } from '@roenlie/lit-utilities/controllers';
import { watch } from '@roenlie/lit-utilities/decorators';
import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { tTerm } from '@roenlie/lit-localize/directive';
import { html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { when } from 'lit/directives/when.js';

import { systemIcons } from '../../utilities/system-icons.js';
import { MMButton } from '../button/button.cmp.js';
import { MMIcon } from '../icon/icon-element.js';
import { tooltip } from '../tooltip/tooltip-directive.js';
import { registerDrawerAnimations } from './drawer-animations.js';
import { drawerStyle } from './drawer-styles.js';

MMButton.register();
MMIcon.register();
registerDrawerAnimations();


/**
 * @slot                          - The drawer's content.
 * @slot label                    - The drawer's label. Alternatively, you can use the `label` attribute.
 * @slot footer                   - The drawer's footer, usually one or more buttons representing various options.
 *
 * @event drawer-connected        - Emitted when the drawers connected callback function is run.
 * @event drawer-request-close    - Emitted when the drawer gets a close request.
 * @event drawer-show             - Emitted when the drawer opens.
 * @event drawer-after-show       - Emitted after the drawer opens and all animations are complete.
 * @event drawer-hide             - Emitted when the drawer closes.
 * @event drawer-after-hide       - Emitted after the drawer closes and all animations are complete.
 * @event drawer-initial-focus    - Emitted when the drawer opens and is ready to receive focus. Calling
 *   `event.preventDefault()` will prevent focusing and allow you to set it on a different element, such as an input.
 * @event {{ source: 'close-button' | 'keyboard' | 'overlay' }} pl-request-close - Emitted when the user attempts to
 *   close the drawer by clicking the close button, clicking the overlay, or pressing escape. Calling
 *   `event.preventDefault()` will keep the drawer open. Avoid using this unless closing the drawer will result in
 *   destructive behavior such as data loss.
 *
 * @csspart base                  - The component's internal wrapper.
 * @csspart overlay               - The overlay.
 * @csspart panel                 - The drawer panel (where the drawer and its content is rendered).
 * @csspart header                - The drawer header.
 * @csspart title                 - The drawer title.
 * @csspart close-button          - The close button.
 * @csspart close-button__base    - The close button's `base` part.
 * @csspart body                  - The drawer body.
 * @csspart footer                - The drawer footer.
 *
 * @cssproperty --panel-size      - The preferred size of the drawer.
 * 	This will be applied to the drawer's width or height depending on its `placement`.
 * 	Note that the drawer will shrink to accommodate smaller screens.
 * @cssproperty --header-spacing  - The amount of padding to use for the header.
 * @cssproperty --body-spacing    - The amount of padding to use for the body.
 * @cssproperty --footer-spacing  - The amount of padding to use for the footer.
 *
 * @animation drawer.showTop      - The animation to use when showing a drawer with `top` placement.
 * @animation drawer.showEnd      - The animation to use when showing a drawer with `end` placement.
 * @animation drawer.showBottom   - The animation to use when showing a drawer with `bottom` placement.
 * @animation drawer.showStart    - The animation to use when showing a drawer with `start` placement.
 * @animation drawer.hideTop      - The animation to use when hiding a drawer with `top` placement.
 * @animation drawer.hideEnd      - The animation to use when hiding a drawer with `end` placement.
 * @animation drawer.hideBottom   - The animation to use when hiding a drawer with `bottom` placement.
 * @animation drawer.hideStart    - The animation to use when hiding a drawer with `start` placement.
 * @animation drawer.denyClose    - The animation to use when a request to close the drawer is denied.
 * @animation drawer.overlay.show - The animation to use when showing the drawer's overlay.
 * @animation drawer.overlay.hide - The animation to use when hiding the drawer's overlay.
 */
@customElement('mm-drawer')
export class MMDrawer extends MimicElement {

	//#region properties
	/** Indicates whether or not the drawer is open. You can use this in lieu of the show/hide methods. */
	@property({ type: Boolean, reflect: true }) public open = false;

	/**
	* By default, the drawer slides out of its containing block (usually the viewport). To make the drawer slide out of
	* its parent element, set this prop and add `position: relative` to the parent.
	*/
	@property({ type: Boolean, reflect: true }) public contained = false;

	/**
	* Removes the header. This will also remove the default close button, so please ensure you provide an easy,
	* accessible way for users to dismiss the drawer.
	*/
	@property({ type: Boolean, reflect: true, attribute: 'no-header'  }) public noHeader = false;

	/**
	* The drawer's label as displayed in the header. You should always include a relevant label even when using
	* `no-header`, as it is required for proper accessibility. If you need to display HTML, you can use the `label` slot
	* instead.
	*/
	@property({ reflect: true }) public label = '';

	/** The direction from which the drawer will open. */
	@property({ reflect: true }) public placement: 'top' | 'end' | 'bottom' | 'start' = 'end';


	protected modal: Modal;
	protected originalTrigger: HTMLElement | null;
	//#endregion

	//#region queries
	@query('.drawer')          protected drawer: HTMLElement;
	@query('.drawer__panel')   protected panel: HTMLElement;
	@query('.drawer__overlay') protected overlay: HTMLElement;
	//#endregion

	//#region controllers
	protected readonly slotController = new SlotController({ host: this, slotNames: [ 'footer' ] });
	//#endregion


	//#region lifecycle
	public override connectedCallback() {
		super.connectedCallback();
		this.modal = new Modal(this);
		emitEvent(this, 'drawer-connected');
	}

	public override firstUpdated() {
		this.drawer.hidden = !this.open;

		if (this.open && !this.contained) {
			this.modal.activate();
			lockBodyScrolling(this);
		}
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();
		unlockBodyScrolling(this);
	}
	//#endregion


	//#region logic
	/** Shows the drawer. */
	public async show() {
		if (this.open)
			return undefined;

		this.open = true;

		return waitForEvent(this, 'drawer-after-show');
	}

	/** Hides the drawer */
	public async hide() {
		if (!this.open)
			return undefined;

		this.open = false;

		return waitForEvent(this, 'drawer-after-hide');
	}

	protected requestClose(source: 'close-button' | 'keyboard' | 'overlay') {
		const requestClose = emitEvent(this, 'drawer-request-close', {
			cancelable: true,
			detail:     { source },
		});

		if (requestClose.defaultPrevented) {
			const animation = getAnimation(this, 'drawer.denyClose');
			animateTo(this.panel, animation.keyframes, animation.options);

			return;
		}

		this.hide();
	}

	protected handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.stopPropagation();
			this.requestClose('keyboard');
		}
	}

	@watch('open', { waitUntilFirstUpdate: true })
	protected async handleOpenChange() {
		if (this.open) {
			// Show
			emitEvent(this, 'drawer-show');

			this.originalTrigger = findActiveElement(document) as HTMLElement;

			// Lock body scrolling only if the drawer isn't contained
			if (!this.contained) {
				this.modal.activate();
				lockBodyScrolling(this);
			}

			// When the drawer is shown, Safari will attempt to set focus on whatever element has autofocus. This causes the
			// drawer's animation to jitter, so we'll temporarily remove the attribute, call `focus({ preventScroll: true })`
			// ourselves, and add the attribute back afterwards.
			//
			// Related: https://github.com/shoelace-style/shoelace/issues/693
			//
			const autoFocusTarget = this.querySelector('[autofocus]');
			if (autoFocusTarget)
				autoFocusTarget.removeAttribute('autofocus');

			await Promise.all([ stopAnimations(this.drawer), stopAnimations(this.overlay) ]);
			this.drawer.hidden = false;

			// Set initial focus
			requestAnimationFrame(() => {
				const initialFocusEv = emitEvent(this, 'drawer-initial-focus', { cancelable: true });

				if (!initialFocusEv.defaultPrevented) {
					// Set focus to the autofocus target and restore the attribute
					if (autoFocusTarget)
						(autoFocusTarget as HTMLInputElement).focus({ preventScroll: true });
					else
						this.panel.focus({ preventScroll: true });
				}

				// Restore the autofocus attribute
				if (autoFocusTarget)
					autoFocusTarget.setAttribute('autofocus', '');
			});

			const panelAnimation = getAnimation(this, `drawer.show${ uppercaseFirstLetter(this.placement) }`);
			const overlayAnimation = getAnimation(this, 'drawer.overlay.show');
			await Promise.all([
				animateTo(this.panel, panelAnimation.keyframes, panelAnimation.options),
				animateTo(this.overlay, overlayAnimation.keyframes, overlayAnimation.options),
			]);

			emitEvent(this, 'drawer-after-show');
		}
		else {
			// Hide
			emitEvent(this, 'drawer-hide');
			this.modal.deactivate();
			unlockBodyScrolling(this);

			await Promise.all([ stopAnimations(this.drawer), stopAnimations(this.overlay) ]);
			const panelAnimation = getAnimation(this, `drawer.hide${ uppercaseFirstLetter(this.placement) }`);
			const overlayAnimation = getAnimation(this, 'drawer.overlay.hide');

			// Animate the overlay and the panel at the same time. Because animation durations might be different, we need to
			// hide each one individually when the animation finishes, otherwise the first one that finishes will reappear
			// unexpectedly. We'll unhide them after all animations have completed.
			await Promise.all([
				animateTo(this.overlay, overlayAnimation.keyframes, overlayAnimation.options).then(() => {
					this.overlay.hidden = true;
				}),
				animateTo(this.panel, panelAnimation.keyframes, panelAnimation.options).then(() => {
					this.panel.hidden = true;
				}),
			]);

			this.drawer.hidden = true;

			// Now that the dialog is hidden, restore the overlay and panel for next time
			this.overlay.hidden = false;
			this.panel.hidden = false;

			// Restore focus to the original trigger
			const trigger = this.originalTrigger;
			if (typeof trigger?.focus === 'function')
				setTimeout(() => trigger.focus());

			emitEvent(this, 'drawer-after-hide');
		}
	}
	//#endregion


	//#region template
	public override render() {
		return html`
		<div
			part="base"
			class=${ classMap({
				drawer:               true,
				'drawer--open':       this.open,
				'drawer--top':        this.placement === 'top',
				'drawer--end':        this.placement === 'end',
				'drawer--bottom':     this.placement === 'bottom',
				'drawer--start':      this.placement === 'start',
				'drawer--contained':  this.contained,
				'drawer--fixed':      !this.contained,
				'drawer--has-footer': this.slotController.test('footer'),
			}) }
			@keydown=${ this.handleKeyDown }
		>
			<div
				tabindex="-1"
				part    ="overlay"
				class   ="drawer__overlay"
				@click  =${ () => this.requestClose('overlay') }
			></div>
			<div
				tabindex       ="-1"
				part           ="panel"
				class          ="drawer__panel"
				role           ="dialog"
				aria-modal     ="true"
				aria-hidden    =${ this.open ? 'false' : 'true' }
				aria-label     =${ ifDefined(this.noHeader ? this.label : undefined) }
				aria-labelledby=${ ifDefined(!this.noHeader ? 'title' : undefined) }
			>
				${ when(!this.noHeader, () => html`
				<header part="header" class="drawer__header">
					<h2 part="title" class="drawer__title" id="title">
						<slot name="label"> ${ this.label } </slot>
					</h2>
					<mm-button
						${ tooltip(tTerm('close')) }
						part   ="close-button"
						class  ="drawer__close"
						type   ="icon"
						shape  ="rounded"
						size   ="x-small"
						variant="text"
						@click =${ () => this.requestClose('close-button') }
					>
						<mm-icon
							template=${ systemIcons.xLg }
						></mm-icon>
					</mm-button>
				</header>
				`) }

				<div part="body" class="drawer__body">
					<slot></slot>
				</div>

				<footer part="footer" class="drawer__footer">
					<slot name="footer"></slot>
				</footer>
			</div>
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = drawerStyle;
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'mm-drawer': MMDrawer;
	}
}
