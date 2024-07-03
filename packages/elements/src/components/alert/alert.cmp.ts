import {
	animateTo, getAnimation,
	setDefaultAnimation, stopAnimations,
} from '@roenlie/core/animation';
import { emitEvent, waitForEvent } from '@roenlie/core/dom';
import { SlotController } from '@roenlie/lit-utilities/controllers';
import { watch } from '@roenlie/lit-utilities/decorators';
import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html, type PropertyValues } from 'lit';
import {  property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { when } from 'lit/directives/when.js';

import { systemIcons } from '../../utilities/system-icons.js';
import { alertPortal } from './alert-portal.cmp.js';
import { type IAlertProps } from './alert-setup-api.js';


declare global { interface HTMLElementTagNameMap {
	'mm-alert': MMAlert;
} }


/**
 * @slot - The alert's content.
 * @slot icon - An icon to show in the alert.
 *
 * @event mm-alert-show - Emitted when the alert opens.
 * @event mm-alert-after-show - Emitted after the alert opens and all animations are complete.
 * @event mm-alert-hide - Emitted when the alert closes.
 * @event mm-alert-after-hide - Emitted after the alert closes and all animations are complete.
 *
 * @csspart base - The component's internal wrapper.
 * @csspart icon - The container that wraps the alert icon.
 * @csspart message - The alert message.
 * @csspart close-button - The close button.
 * @csspart close-button__base - The close button's `base` part.
 *
 * @cssproperty --box-shadow - The alert's box shadow.
 *
 * @animation alert.show - The animation to use when showing the alert.
 * @animation alert.hide - The animation to use when hiding the alert.
 */
@customElement('mm-alert')
export class MMAlert extends MimicElement {

	//#region properties
	/** Indicates whether or not the alert is open. You can use this in lieu of the show/hide methods. */
	@property({ type: Boolean, reflect: true }) public open = false;

	/** Makes the alert closable. */
	@property({ type: Boolean, reflect: true }) public closable = false;

	/**
   * The length of time, in milliseconds, the alert will show before closing itself. If the user interacts with
   * the alert before it closes (e.g. moves the mouse over it), the timer will restart. Defaults to `Infinity`.
   */
	@property({ type: Number }) public duration = Infinity;

	/** The alert's variant. */
	@property({ reflect: true }) public variant: IAlertProps['variant'] = 'primary';

	@query('[part="base"]') protected base: HTMLElement;

	public toastPromise = Promise.resolve();
	protected toastListenerRef: () => void;
	//#endregion


	//#region controllers
	protected autoHideTimeout: number;
	protected readonly slotController = new SlotController({
		host:      this,
		slotNames: [ 'icon', 'suffix' ],
	});
	//#endregion


	//#region lifecycle
	public override connectedCallback() {
		super.connectedCallback();
	}

	protected override firstUpdated(props: PropertyValues) {
		super.firstUpdated(props);
		this.base.hidden = !this.open;
	}
	//#endregion


	//#region logic
	/** Shows the alert. */
	public async show() {
		if (this.open)
			return undefined;

		this.open = true;

		return waitForEvent(this, 'mm-alert-after-show');
	}

	/** Hides the alert */
	public async hide() {
		if (!this.open)
			return undefined;

		this.open = false;

		return waitForEvent(this, 'mm-alert-after-hide');
	}

	protected onAfterHide = (resolve: (value: void | PromiseLike<void>) => void) => {
		alertPortal.removeChild(this);
		resolve();

		// Remove the toast stack from the DOM when there are no more alerts
		if (alertPortal.querySelector(MMAlert.tagName) === null)
			alertPortal.remove();
	};

	/**
	 * Displays the alert as a toast notification. This will move the alert out of its position in the DOM and, when
	 * dismissed, it will be removed from the DOM completely. By storing a reference to the alert, you can reuse it by
	 * calling this method again. The returned promise will resolve after the alert is hidden.
	 */
	public async toast() {
		this.toastPromise = new Promise<void>((resolve, reject) => {
			this.restartAutoHide();

			if (alertPortal.parentElement === null)
				document.body.append(alertPortal);

			alertPortal.renderRoot.appendChild(this);

			// Wait for the toast stack to render
			requestAnimationFrame(() => {
				// force a reflow for the initial transition
				this.clientWidth;
				this.show();
			});

			if (!this.toastListenerRef) {
				this.toastListenerRef = () => {
					if (!alertPortal.renderRoot.contains(this)) {
						reject('Toast does not exist in stack');
					}
					else {
						alertPortal.renderRoot.removeChild(this);
						resolve();
					}

					// Remove the toast stack from the DOM when there are no more alerts
					if (alertPortal.renderRoot.querySelector(MMAlert.tagName) === null)
						alertPortal.remove();
				};
			}

			this.removeEventListener('mm-alert-after-hide', this.toastListenerRef);
			this.addEventListener('mm-alert-after-hide', this.toastListenerRef, { once: true });
		});

		return this.toastPromise;
	}

	public restartAutoHide() {
		clearTimeout(this.autoHideTimeout);
		if (this.open && this.duration < Infinity)
			this.autoHideTimeout = window.setTimeout(() => this.hide(), this.duration);
	}

	protected handleCloseClick() {
		this.hide();
	}

	protected handleMouseMove() {
		this.restartAutoHide();
	}

	@watch('open', { waitUntilFirstUpdate: true })
	protected async handleOpenChange() {
		if (this.open) {
			// Show
			emitEvent(this, 'mm-alert-show');

			if (this.duration < Infinity)
				this.restartAutoHide();

			await stopAnimations(this.base);
			this.base.hidden = false;
			const { keyframes, options } = getAnimation(this, 'mm-alert.show');
			await animateTo(this.base, keyframes, options);

			emitEvent(this, 'mm-alert-after-show');
		}
		else {
			// Hide
			emitEvent(this, 'mm-alert-hide');

			clearTimeout(this.autoHideTimeout);

			await stopAnimations(this.base);
			const { keyframes, options } = getAnimation(this, 'mm-alert.hide');
			await animateTo(this.base, keyframes, options);
			this.base.hidden = true;

			emitEvent(this, 'mm-alert-after-hide');
		}
	}

	@watch('duration')
	protected handleDurationChange() {
		this.restartAutoHide();
	}
	//#endregion


	//#region template
	public override render() {
		return html`
		<div
			part="base"
			class=${ classMap({
				alert:                        true,
				'alert--open':                this.open,
				'alert--closable':            this.closable,
				'alert--has-icon':            this.slotController.test('icon'),
				[`alert--${ this.variant }`]: true,
			}) }
			role="alert"
			aria-live="assertive"
			aria-atomic="true"
			aria-hidden=${ this.open ? 'false' : 'true' }
			@mousemove=${ this.handleMouseMove }
		>
			<span part="icon" class="alert__icon">
				<slot name="icon"></slot>
			</span>

			<span part="message" class="alert__message">
				<slot></slot>
			</span>

			${ when(this.closable, () => html`
			<mm-button
				part="close-button"
				exportparts="base:close-button__base"
				class="alert__close-button"
				type="icon"
				size="small"
				variant="text"
				@click=${ this.handleCloseClick }
			>
				<mm-icon template=${ systemIcons.xLg }></mm-icon>
			</mm-button>
			`) }
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		sharedStyles,
		css` /* Variables */
		:host {
			--_alert-bg-color:      var(--mm-alert-color-bg,      rgb(0 31 37));
			--_alert-txt-color:     var(--mm-alert-color-txt,     rgb( 166 238 255 ));
			--_alert-border-width:  var(--mm-alert-border-width,  1px);
			--_alert-border-color:  var(--mm-alert-border-color,  var(--mm-surface-variant));
			--_alert-border-radius: var(--mm-alert-border-radius, 4px);

			-_box-shadow: 0px 1px 3px 1px rgba(0, 0, 0, 0.25) , 0px 0px 2px 0px rgba(0, 0, 0, 0.10);
			--_alert-shadow:   var(--mm-alert-shadow,   var(-_box-shadow));
			--_alert-primary:  var(--mm-alert-primary,  rgb( 226 197 75 ));
			--_alert-success:  var(--mm-alert-success,  rgb( 143 218 91 ));
			--_alert-neutral:  var(--mm-alert-neutral,  rgb( 150 144 128 ));
			--_alert-warning:  var(--mm-alert-warning,  rgb( 214 202 0 ));
			--_alert-error:    var(--mm-alert-error,    rgb( 105 0 5 ));
			--_alert-padding:  var(--mm-alert-padding,  16px);
			--_alert-padleft:  var(--mm-alert-padleft,  16px);
			--_alert-padright: var(--mm-alert-padright, 12px);
		}
		`,
		css`
		:host {
			display: block;
		}
		.alert {
			position: relative;
			display: grid;
			grid-template: "icon message button" 1fr / auto 1fr auto;
			align-items: center;
			background-color: var(--_alert-bg-color);
			color: var(--_alert-txt-color);
			border: var(--_alert-border-width) solid var(--_alert-border-color);
			border-right-width: calc(var(--_alert-border-width) * 3);
			border-radius: var(--_alert-border-radius);
			box-shadow: var(--_alert-shadow);
		}
		.alert:not(.alert--has-icon) .alert__icon,
		.alert:not(.alert--closable) .alert__close-button {
			display: none;
		}
		.alert__icon {
			grid-area: icon;
			padding-left: var(--_alert-padleft);
		}
		.alert--primary {
			border-right-color: var(--_alert-primary);
		}
		.alert--primary .alert__icon {
			color: var(--_alert-primary);
		}
		.alert--success {
			border-right-color: var(--_alert-success);
		}
		.alert--success .alert__icon {
			color: var(--_alert-success);
		}
		.alert--neutral {
			border-right-color: var(--_alert-neutral);
		}
		.alert--neutral .alert__icon {
			color: var(--_alert-neutral);
		}
		.alert--warning {
			border-right-color: var(--_alert-warning);
		}
		.alert--warning .alert__icon {
			color: var(--_alert-warning);
		}
		.alert--error {
			border-right-color: var(--_alert-error);
		}
		.alert--error .alert__icon {
			color: var(--_alert-error);
		}
		.alert__message {
			grid-area: message;
			padding: var(--_alert-padding);
			overflow: hidden;
		}
		.alert__close-button {
			grid-area: button;
			padding-right: var(--_alert-padright);
		}
		`,
	];
	//#endregion

}

setDefaultAnimation('mm-alert.show', {
	keyframes: [
		{ opacity: 0, transform: 'scale(0.8)' },
		{ opacity: 1, transform: 'scale(1)' },
	],
	options: { duration: 300, easing: 'ease-out' },
});

setDefaultAnimation('mm-alert.hide', {
	keyframes: [
		{ opacity: 1, transform: 'scale(1)' },
		{ opacity: 0, transform: 'scale(0.8)' },
	],
	options: { duration: 300, easing: 'ease-in' },
});
