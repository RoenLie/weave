import { domId, emitEvent, focusVisibleSelector } from '@roenlie/core/dom';
import { LocalizeController } from '@roenlie/lit-utilities/controllers';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { when } from 'lit/directives/when.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


/**
 * @slot - The tab's label.
 *
 * @event pl-close - Emitted when the tab is closable and the close button is activated.
 *
 * @csspart base - The component's internal wrapper.
 * @csspart close-button - The close button.
 * @csspart close-button__base - The close button's `base` part.
 */
@customElement('pl-tab')
export class TabCmp extends LitElement {

	//#region properties
	protected readonly attrId = domId();
	protected readonly componentId = `pl-tab-${ this.attrId }`;

	/** The locale to render the component in. */
	@property() public override lang: string;
	@property({ attribute: 'indicator-color' }) public indicatorColor?: string;

	/** The name of the tab panel the tab will control.
	 * The panel must be located in the same tab group. */
	@property({ reflect: true }) public panel = '';

	/** Draws the tab in an active state. */
	@property({ type: Boolean, reflect: true }) public active = false;

	/** Draws the tab in a disabled state. */
	@property({ type: Boolean, reflect: true }) public disabled = false;

	/** Makes the tab closable and shows a close icon. */
	@property({ type: Boolean }) public closable = false;
	//#endregion


	//#region queries
	@query('.tab') protected tab: HTMLElement;
	//#endregion


	//#region controllers
	protected readonly localize = new LocalizeController({ host: this });
	//#endregion


	//#region lifecycle
	//#endregion


	//#region logic
	/** Sets focus to the tab. */
	public override focus(options?: FocusOptions) {
		this.tab.focus(options);
	}

	/** Removes focus from the tab. */
	public override blur() {
		this.tab.blur();
	}

	public override click() {
		this.tab.click();
	}

	public handleCloseClick() {
		emitEvent(this, 'pl-close');
	}
	//#endregion


	//#region template
	public override render() {
		// If the user didn't provide an ID,
		// we'll set one so we can link tabs and tab panels with aria labels
		this.id = this.id.length > 0 ? this.id : this.componentId;

		return html`
		<button
			part           ="base"
			role           ="tab"
			class          =${ classMap({
				tab:             true,
				'tab--active':   this.active,
				'tab--closable': this.closable,
				'tab--disabled': this.disabled,
			}) }
			aria-disabled  =${ this.disabled ? 'true' : 'false' }
			aria-selected  =${ this.active ? 'true' : 'false' }
			tabindex       =${ this.disabled || !this.active ? '-1' : '0' }
		>
			<slot></slot>

			${ when(this.closable, () => html`
			<pl-icon
				tabindex    ="-1"
				part        ="close-button"
				exportparts ="base:close-button__base"
				class       ="tab__close-button"
				name        ="x-lg"
				library     ="system"
				size        ="medium"
				label       =${ this.localize.term('close') }
				@click      =${ this.handleCloseClick.bind(this) }
			></pl-icon>
			`) }
		</button>
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		componentStyles,
		css`
		:host {
			--border-radius: var(--border-radius-s);
			--color-neutral: var(--on-surface);
			--color-primary: var(--primary);

			display: inline-grid;
		}
		.tab {
			display: inline-flex;
			align-items: center;
			border-radius: var(--border-radius);
			color: var(--color-neutral);
			padding-inline: var(--spacing-s);
			height: 48px;
			box-sizing: content-box;

			white-space: nowrap;
			user-select: none;
			cursor: pointer;

			outline: none;
			transition: outline-offset var(--transition-fast) ease-out;
		}
		@media (pointer: fine) {
			.tab:hover:not(.tab--disabled) {
				color: var(--color-primary);
			}
		}
		.tab${ focusVisibleSelector }:not(.tab--disabled) {
			outline: 3px solid var(--focus-primary-0-color);
		}
		.tab${ focusVisibleSelector }:active:not(.tab--disabled) {
			outline-offset: -2px;
		}
		.tab.tab--active:not(.tab--disabled) {
			color: var(--color-primary);
		}
		.tab.tab--closable {
			padding-inline-end: var(--spacing-s);
		}
		.tab.tab--disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		.tab__close-button {
			color: var(--color-neutral);
			margin-inline-start: var(--spacing-xs);
		}
		@media (pointer: fine) {
			.tab:not(.tab--disabled) .tab__close-button:hover {
				color: var(--color-primary);
			}
		}
		.tab__close-button::part(base) {
			padding: var(--spacing-xs);
		}
		`,
	];
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-tab': TabCmp;
	}
}
