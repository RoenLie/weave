import { domId, emitEvent } from '@roenlie/core/dom';
import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { when } from 'lit/directives/when.js';

import { systemIcons } from '../../utilities/system-icons.js';


declare global { interface HTMLElementTagNameMap {
	'mm-tab': MMTab;
} }


/**
 * @slot - The tab's label.
 *
 * @event mm-tab-close - Emitted when the tab is closable and the close button is activated.
 *
 * @csspart base - The component's internal wrapper.
 * @csspart close-button - The close button.
 * @csspart close-button__base - The close button's `base` part.
 */
@customElement('mm-tab')
export class MMTab extends MimicElement {

	//#region properties
	protected readonly componentId = `${ MMTab.tagName }-${ domId(4) }`;

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
		emitEvent(this, 'mm-tab-close');
	}
	//#endregion


	//#region template
	public override render() {
		// If the user didn't provide an ID,
		// we'll set one so we can link tabs and tab panels with aria labels
		if (!this.id)
			this.id = this.componentId;

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
			<mm-button
				type       ="icon"
				variant    ="text"
				size       ="x-small"
				part       ="close-button"
				exportparts="base:close-button__base"
				class      ="tab__close-button"
				@click     =${ this.handleCloseClick.bind(this) }
			>
				<mm-icon
					template =${ systemIcons.xLg }
					font-size="font-size:20px;"
				></mm-icon>
			</mm-button>
			`) }
		</button>
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		sharedStyles,
		css`
		:host {
			display: inline-grid;
		}
		.tab {
			display: inline-flex;
			align-items: center;
			color: var(--_tab-color-neutral);
			border-radius: var(--_tab-border-radius);
			padding-inline: var(--_tab-spacing-s);
			height: var(--_tab-height);
			box-sizing: content-box;

			white-space: nowrap;
			user-select: none;
			cursor: pointer;

			outline: none;
			transition: outline-offset var(--_tab-transition) ease-out;
		}
		@media (pointer: fine) {
			.tab:hover:not(.tab--disabled) {
				color: var(--_tab-color-primary);
			}
		}
		.tab:focus-visible:not(.tab--disabled) {
			outline: 3px solid var(--_tab-color-focus);
		}
		.tab:focus-visible:active:not(.tab--disabled) {
			outline-offset: -2px;
		}
		.tab.tab--active:not(.tab--disabled) {
			color: var(--_tab-color-primary);
		}
		.tab.tab--closable {
			padding-inline-end: var(--_tab-spacing-s);
		}
		.tab.tab--disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		.tab__close-button {
			color: var(--_tab-color-neutral);
			margin-inline-start: var(--_tab-spacing-xs);
		}
		@media (pointer: fine) {
			.tab:not(.tab--disabled) .tab__close-button:hover {
				color: var(--_tab-color-primary);
			}
		}
		.tab__close-button::part(base) {
			padding: var(--_tab-spacing-xs);
		}
		`,
	];
	//#endregion

}
