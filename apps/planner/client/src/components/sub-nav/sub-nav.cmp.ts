import { findActiveElement } from '@roenlie/core/dom';
import { EventController } from '@roenlie/lit-utilities/controllers';
import { css, html, LitElement } from 'lit';
import { customElement, property, queryAssignedElements } from 'lit/decorators.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


@customElement('pl-sub-nav')
export class SubNavCmp extends LitElement {

	@queryAssignedElements() protected slottedElementsQry: SubNavItemCmp[];
	protected readonly eventController = new EventController({ host: this });

	public override connectedCallback(): void {
		super.connectedCallback();

		this.eventController.addEventListener(this, 'focusin', this.handleFocusin);
		this.eventController.addEventListener(this, 'keydown', this.handleKeydown);
	}

	protected handleFocusin = () => {
		let activeElement = this.slottedElementsQry.find(el => findActiveElement(el));
		if (activeElement) {
			this.slottedElementsQry.forEach(el => el.renderRoot.querySelector('button')!.tabIndex = -1);
			activeElement.renderRoot.querySelector('button')!.tabIndex = 0;
		}
	};

	protected handleKeydown = (ev: KeyboardEvent) => {
		if ([ 'ArrowUp', 'ArrowDown' ].includes(ev.code)) {
			ev.preventDefault();

			let activeElement = this.slottedElementsQry.find(el => findActiveElement(el));
			if (!activeElement)
				return;

			this.slottedElementsQry.forEach(el => el.renderRoot.querySelector('button')!.tabIndex = -1);
			const activeIndex = this.slottedElementsQry.indexOf(activeElement);

			let next: SubNavItemCmp | undefined;
			if (ev.code === 'ArrowUp')
				next = this.slottedElementsQry.at(Math.max(0, activeIndex - 1));
			else
				next = this.slottedElementsQry.at(activeIndex + 1);

			const button = next?.renderRoot.querySelector('button');
			if (button) {
				button.tabIndex = 0;
				button.focus();
			}
		}
	};

	public override render() {
		return html`
		<slot></slot>
		`;
	}

	public static override styles = [
		css`
		:host {
			display: flex;
			flex-flow: column nowrap;
			padding: var(--spacing-m);
			gap: var(--spacing-s);
		}
	`,
	];

}


@customElement('pl-sub-nav-item')
export class SubNavItemCmp extends LitElement {

	@property({ type: Boolean, reflect: true }) public active?: boolean;

	public override render() {
		return html`
		<pl-ripple>
			<button>
				<slot name="icon"></slot>
				<slot></slot>
			</button>
		</pl-ripple>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			display: block;
		}
		pl-ripple {
			position: relative;
			display: grid;
			width: 100%;
		}
		pl-ripple,
		button {
			border-radius: var(--border-radius-m);
			border-radius: var(--border-radius-m);
		}
		button {
			display: grid;
			grid-template-areas: "icon text";
			grid-template-columns: auto 1fr;
			grid-template-rows: 1fr;
			padding: var(--spacing-s);
			place-items: center start;
			cursor: pointer;
			box-shadow: var(--box-shadow-s);
		}
		button::after {
			content: '';
			pointer-events: none;
			inset: 0;
			position: absolute;
			border-radius: inherit;
		}
		button:focus-visible::after {
			outline: var(--focus-ring);
			outline-offset: var(--focus-offset);
			transition: var(--focus-transition);
			z-index: var(--focus-index);
		}
		button:active::after {
			outline-offset: 1px;
		}
		:host([active]) button {
			background-color: var(--secondary-container);
			color: var(--on-secondary-container);
		}
		button:hover {
			background-color: var(--secondary-container-hover);
		}
		::slotted(*) {
			grid-area: text;
		}
		slot[name="icon"]::slotted(*) {
			grid-area: icon;
			padding-right: var(--spacing-m);
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-sub-nav': SubNavCmp;
		'pl-sub-nav-item': SubNavItemCmp;

	}
}
