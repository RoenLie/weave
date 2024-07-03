import { animateTo, animationSpeed, getAnimation, setDefaultAnimation, stopAnimations } from '@roenlie/core/animation';
import { emitEvent, waitForEvent } from '@roenlie/core/dom';
import { HasSlotController, LocalizeController } from '@roenlie/lit-utilities/controllers';
import { watch } from '@roenlie/lit-utilities/decorators';
import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { when } from 'lit/directives/when.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';
import { alertPortal } from './alert-portal.cmp.js';
import { IAlertProps } from './alert-setup-api.js';


/**
 * @dependency pl-button
 * @dependency pl-boot-icon
 *
 * @slot - The alert's content.
 * @slot icon - An icon to show in the alert.
 *
 * @event alert-show - Emitted when the alert opens.
 * @event alert-after-show - Emitted after the alert opens and all animations are complete.
 * @event alert-hide - Emitted when the alert closes.
 * @event alert-after-hide - Emitted after the alert closes and all animations are complete.
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
@customElement('pl-alert')
export class AlertCmp extends LitElement {

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
	protected readonly hasSlotController = new HasSlotController({ host: this, slotNames: [ 'icon', 'suffix' ] });
	protected readonly localize = new LocalizeController({ host: this });
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

		return waitForEvent(this, 'alert-after-show');
	}

	/** Hides the alert */
	public async hide() {
		if (!this.open)
			return undefined;

		this.open = false;

		return waitForEvent(this, 'alert-after-hide');
	}

	protected onAfterHide = (resolve: (value: void | PromiseLike<void>) => void) => {
		alertPortal.removeChild(this);
		resolve();

		// Remove the toast stack from the DOM when there are no more alerts
		if (alertPortal.querySelector('pl-alert') === null)
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
					if (alertPortal.renderRoot.querySelector('pl-alert') === null)
						alertPortal.remove();
				};
			}

			this.removeEventListener('alert-after-hide', this.toastListenerRef);
			this.addEventListener('alert-after-hide', this.toastListenerRef, { once: true });
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
			emitEvent(this, 'alert-show');

			if (this.duration < Infinity)
				this.restartAutoHide();

			await stopAnimations(this.base);
			this.base.hidden = false;
			const { keyframes, options } = getAnimation(this, 'alert.show', { dir: this.localize.dir() });
			await animateTo(this.base, keyframes, options);

			emitEvent(this, 'alert-after-show');
		}
		else {
			// Hide
			emitEvent(this, 'alert-hide');

			clearTimeout(this.autoHideTimeout);

			await stopAnimations(this.base);
			const { keyframes, options } = getAnimation(this, 'alert.hide', { dir: this.localize.dir() });
			await animateTo(this.base, keyframes, options);
			this.base.hidden = true;

			emitEvent(this, 'alert-after-hide');
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
				alert:             true,
				'alert--open':     this.open,
				'alert--closable': this.closable,
				'alert--has-icon': this.hasSlotController.test('icon'),
				'alert--primary':  this.variant === 'primary',
				'alert--success':  this.variant === 'success',
				'alert--neutral':  this.variant === 'neutral',
				'alert--warning':  this.variant === 'warning',
				'alert--error':    this.variant === 'error',
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
			<pl-button
				part="close-button"
				exportparts="base:close-button__base"
				class="alert__close-button"
				type="icon"
				size="small"
				variant="text"
				@click=${ this.handleCloseClick }
			>
				<pl-boot-icon icon="x-lg"></pl-boot-icon>
			</pl-button>
			`) }
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		componentStyles,
		css`
		:host {
			display: contents;
			--border-width: 1px;
		}
		.alert {
			position: relative;
			display: grid;
			grid-template: "icon message button" 1fr / auto 1fr auto;
			align-items: center;
			background-color: var(--surface);
			color: var(--on-surface);
			border: var(--border-width) solid var(--surface-variant);
			border-right-width: calc(var(--border-width) * 3);
			border-radius: var(--border-radius-s);
			margin: inherit;
			box-shadow: var(--box-shadow-s);
		}
		.alert:not(.alert--has-icon) .alert__icon,
		.alert:not(.alert--closable) .alert__close-button {
			display: none;
		}
		.alert__icon {
			grid-area: icon;
			padding-inline-start: var(--spacing-l);
		}
		.alert--primary {
			border-right-color: var(--primary);
		}
		.alert--primary .alert__icon {
			color: var(--primary);
		}
		.alert--success {
			border-right-color: var(--success);
		}
		.alert--success .alert__icon {
			color: var(--success);
		}
		.alert--neutral {
			border-right-color: var(--outline);
		}
		.alert--neutral .alert__icon {
			color: var(--outline);
		}
		.alert--warning {
			border-right-color: var(--warning);
		}
		.alert--warning .alert__icon {
			color: var(--warning);
		}
		.alert--error {
			border-right-color: var(--on-error);
		}
		.alert--error .alert__icon {
			color: var(--error);
		}
		.alert__message {
			grid-area: message;
			padding: var(--spacing-l);
			overflow: hidden;
		}
		.alert__close-button {
			grid-area: button;
			padding-inline-end: var(--spacing-m);
		}
		`,
	];
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-alert': AlertCmp;
	}
}


const animDuration = animationSpeed('medium');

setDefaultAnimation('alert.show', {
	keyframes: [
		{ opacity: 0, transform: 'scale(0.8)' },
		{ opacity: 1, transform: 'scale(1)' },
	],
	options: { duration: animDuration, easing: 'ease-out' },
});

setDefaultAnimation('alert.hide', {
	keyframes: [
		{ opacity: 1, transform: 'scale(1)' },
		{ opacity: 0, transform: 'scale(0.8)' },
	],
	options: { duration: animDuration, easing: 'ease-in' },
});
